import Database from 'better-sqlite3';
import path from 'path';
import { Document } from './types';

// Database connection
const DB_PATH = path.join(__dirname, '../../data/admin_ui.db');
const db = new Database(DB_PATH);

export class DocumentRepository {
  private db: Database.Database;

  constructor() {
    this.db = db;
  }

  // Get all documents for an entity
  getByEntity(entityType: 'client' | 'account', entityId: number): Document[] {
    const stmt = this.db.prepare(`
      SELECT * FROM documents 
      WHERE entityType = ? AND entityId = ? AND isActive = 1 
      ORDER BY uploadedAt DESC
    `);
    return stmt.all(entityType, entityId) as Document[];
  }

  // Get document by ID
  getById(id: number): Document | undefined {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE id = ? AND isActive = 1');
    return stmt.get(id) as Document | undefined;
  }

  // Get documents by type for an entity
  getByTypeAndEntity(documentType: string, entityType: 'client' | 'account', entityId: number): Document[] {
    const stmt = this.db.prepare(`
      SELECT * FROM documents 
      WHERE documentType = ? AND entityType = ? AND entityId = ? AND isActive = 1 
      ORDER BY uploadedAt DESC
    `);
    return stmt.all(documentType, entityType, entityId) as Document[];
  }

  // Create new document record
  create(document: Omit<Document, 'id' | 'uploadedAt' | 'updatedAt'>): Document {
    const stmt = this.db.prepare(`
      INSERT INTO documents (
        entityType, entityId, documentType, documentNumber, fileName, filePath, 
        fileSize, mimeType, expiryDate, isVerified, isActive, verifiedBy, 
        verifiedAt, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      document.entityType,
      document.entityId,
      document.documentType,
      document.documentNumber || null,
      document.fileName,
      document.filePath,
      document.fileSize,
      document.mimeType,
      document.expiryDate || null,
      document.isVerified ? 1 : 0,
      document.isActive ? 1 : 0,
      document.verifiedBy || null,
      document.verifiedAt || null,
      document.notes || null
    );

    return { ...document, id: result.lastInsertRowid as number };
  }

  // Update document
  update(id: number, document: Partial<Omit<Document, 'id' | 'uploadedAt' | 'updatedAt'>>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'documentNumber', 'fileName', 'filePath', 'fileSize', 'mimeType', 
      'expiryDate', 'isVerified', 'isActive', 'verifiedBy', 'verifiedAt', 'notes'
    ];

    Object.entries(document).forEach(([key, value]) => {
      if (value !== undefined && allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    const result = stmt.run(...values);

    return result.changes > 0;
  }

  // Soft delete document
  delete(id: number): boolean {
    const stmt = this.db.prepare('UPDATE documents SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Hard delete document
  hardDelete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM documents WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Verify document
  verify(id: number, verifiedBy: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE documents 
      SET isVerified = 1, verifiedBy = ?, verifiedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    const result = stmt.run(verifiedBy, id);
    return result.changes > 0;
  }
}
