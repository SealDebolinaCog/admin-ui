import { getDatabase } from './database';

export interface Document {
  id?: number;
  entityType: 'client' | 'account';
  entityId: number;
  documentType: 'pan_card' | 'aadhar_card' | 'passport' | 'driving_license' | 'voter_id' | 'passbook_page' | 'statement' | 'cheque_leaf' | 'fd_receipt' | 'loan_document';
  documentNumber?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt?: string;
  updatedAt?: string;
  expiryDate?: string;
  isVerified?: number;
  isActive?: number;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface DocumentWithDetails extends Document {
  // Client details (when entityType = 'client')
  firstName?: string;
  lastName?: string;
  email?: string;
  // Account details (when entityType = 'account')
  accountNumber?: string;
  accountType?: string;
  institutionName?: string;
}

export class DocumentRepository {
  private db = getDatabase();

  // Create a new document
  create(document: Omit<Document, 'id' | 'uploadedAt' | 'updatedAt' | 'isActive'>): Document {
    const stmt = this.db.prepare(`
      INSERT INTO documents (
        entityType, entityId, documentType, documentNumber, fileName, filePath,
        fileSize, mimeType, expiryDate, isVerified, verifiedBy, verifiedAt, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      document.isVerified || 0,
      document.verifiedBy || null,
      document.verifiedAt || null,
      document.notes || null
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  // Find document by ID
  findById(id: number): Document | null {
    const stmt = this.db.prepare(`
      SELECT * FROM documents WHERE id = ? AND isActive = 1
    `);
    return stmt.get(id) as Document | null;
  }

  // Find all documents for an entity
  findByEntity(entityType: 'client' | 'account', entityId: number): Document[] {
    const stmt = this.db.prepare(`
      SELECT * FROM documents 
      WHERE entityType = ? AND entityId = ? AND isActive = 1
      ORDER BY uploadedAt DESC
    `);
    return stmt.all(entityType, entityId) as Document[];
  }

  // Find documents by type
  findByDocumentType(documentType: string): Document[] {
    const stmt = this.db.prepare(`
      SELECT * FROM documents 
      WHERE documentType = ? AND isActive = 1
      ORDER BY uploadedAt DESC
    `);
    return stmt.all(documentType) as Document[];
  }

  // Find documents by verification status
  findByVerificationStatus(isVerified: boolean): Document[] {
    const stmt = this.db.prepare(`
      SELECT * FROM documents 
      WHERE isVerified = ? AND isActive = 1
      ORDER BY uploadedAt DESC
    `);
    return stmt.all(isVerified ? 1 : 0) as Document[];
  }

  // Find expiring documents (within specified days)
  findExpiringDocuments(withinDays: number = 30): Document[] {
    const stmt = this.db.prepare(`
      SELECT * FROM documents 
      WHERE expiryDate IS NOT NULL 
        AND date(expiryDate) <= date('now', '+' || ? || ' days')
        AND isActive = 1
      ORDER BY expiryDate ASC
    `);
    return stmt.all(withinDays) as Document[];
  }

  // Find client documents with client details
  findClientDocumentsWithDetails(): DocumentWithDetails[] {
    const stmt = this.db.prepare(`
      SELECT d.*, c.firstName, c.lastName, c.email
      FROM documents d
      JOIN clients c ON d.entityId = c.id
      WHERE d.entityType = 'client' AND d.isActive = 1 AND c.deletionStatus = 'active'
      ORDER BY d.uploadedAt DESC
    `);
    return stmt.all() as DocumentWithDetails[];
  }

  // Find account documents with account details
  findAccountDocumentsWithDetails(): DocumentWithDetails[] {
    const stmt = this.db.prepare(`
      SELECT d.*, a.accountNumber, a.accountType, i.institutionName
      FROM documents d
      JOIN accounts a ON d.entityId = a.id
      JOIN institutions i ON a.institutionId = i.id
      WHERE d.entityType = 'account' AND d.isActive = 1 AND a.deletionStatus = 'active'
      ORDER BY d.uploadedAt DESC
    `);
    return stmt.all() as DocumentWithDetails[];
  }

  // Update document
  update(id: number, updates: Partial<Document>): Document | null {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'uploadedAt' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE documents SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }

  // Verify document
  verifyDocument(id: number, verifiedBy: string, notes?: string): Document | null {
    const stmt = this.db.prepare(`
      UPDATE documents 
      SET isVerified = 1, verifiedBy = ?, verifiedAt = CURRENT_TIMESTAMP, 
          notes = COALESCE(?, notes), updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(verifiedBy, notes || null, id);
    return this.findById(id);
  }

  // Soft delete document
  softDelete(id: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE documents SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Hard delete document
  hardDelete(id: number): boolean {
    const stmt = this.db.prepare(`DELETE FROM documents WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Restore soft-deleted document
  restore(id: number): Document | null {
    const stmt = this.db.prepare(`
      UPDATE documents SET isActive = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(id);
    
    // Return the restored document (check both active and inactive)
    const getStmt = this.db.prepare(`SELECT * FROM documents WHERE id = ?`);
    return getStmt.get(id) as Document | null;
  }

  // Get document statistics
  getDocumentStats(): Array<{
    entityType: string;
    documentType: string;
    count: number;
    verifiedCount: number;
    totalSize: number;
    avgSize: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT 
        entityType,
        documentType,
        COUNT(*) as count,
        SUM(CASE WHEN isVerified = 1 THEN 1 ELSE 0 END) as verifiedCount,
        SUM(fileSize) as totalSize,
        AVG(fileSize) as avgSize
      FROM documents 
      WHERE isActive = 1
      GROUP BY entityType, documentType
      ORDER BY entityType, documentType
    `);
    return stmt.all() as Array<{
      entityType: string;
      documentType: string;
      count: number;
      verifiedCount: number;
      totalSize: number;
      avgSize: number;
    }>;
  }

  // Find all documents (with pagination)
  findAll(limit: number = 50, offset: number = 0): Document[] {
    const stmt = this.db.prepare(`
      SELECT * FROM documents 
      WHERE isActive = 1
      ORDER BY uploadedAt DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as Document[];
  }

  // Search documents by document number or filename
  search(query: string): Document[] {
    const stmt = this.db.prepare(`
      SELECT * FROM documents 
      WHERE (documentNumber LIKE ? OR fileName LIKE ?) AND isActive = 1
      ORDER BY uploadedAt DESC
    `);
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm) as Document[];
  }
}
