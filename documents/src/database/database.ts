import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file path
const DB_PATH = path.join(__dirname, '../../data/documents.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database instance
const db = new Database(DB_PATH);

// Enable foreign keys and WAL mode for better performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize database tables
export function initializeDatabase() {
  console.log('Initializing Documents module database...');
  
  // Read and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split schema by semicolons and execute each statement
  const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
  
  for (const statement of statements) {
    try {
      db.exec(statement + ';');
    } catch (error: any) {
      if (!error.message.includes('already exists') && !error.message.includes('UNIQUE constraint failed')) {
        console.error('Error executing schema statement:', error.message);
        console.error('Statement:', statement);
      }
    }
  }
  
  console.log('Documents database initialized successfully!');
}

// Get database instance
export function getDatabase(): Database.Database {
  return db;
}

// Close database connection
export function closeDatabase() {
  db.close();
}

// Database helper functions
export class DocumentsDB {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  // Entity management
  createOrUpdateEntity(entityType: string, externalEntityId: number, entityName?: string) {
    const stmt = this.db.prepare(`
      INSERT INTO entities (entityType, externalEntityId, entityName, updatedAt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(entityType, externalEntityId) 
      DO UPDATE SET entityName = ?, updatedAt = CURRENT_TIMESTAMP
    `);
    return stmt.run(entityType, externalEntityId, entityName, entityName);
  }

  getEntity(entityType: string, externalEntityId: number) {
    const stmt = this.db.prepare(`
      SELECT * FROM entities 
      WHERE entityType = ? AND externalEntityId = ?
    `);
    return stmt.get(entityType, externalEntityId);
  }

  // Document type management
  getDocumentTypes(category?: string) {
    let query = 'SELECT * FROM document_types WHERE isActive = 1';
    const params: any[] = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY displayName';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  getDocumentTypeByName(typeName: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM document_types 
      WHERE typeName = ? AND isActive = 1
    `);
    return stmt.get(typeName);
  }

  // Document management
  createDocument(documentData: {
    entityId: number;
    documentTypeId: number;
    documentNumber?: string;
    fileName: string;
    originalFileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    fileHash?: string;
    expiryDate?: string;
    notes?: string;
    metadata?: string;
  }) {
    const stmt = this.db.prepare(`
      INSERT INTO documents (
        entityId, documentTypeId, documentNumber, fileName, originalFileName,
        filePath, fileSize, mimeType, fileHash, expiryDate, notes, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      documentData.entityId,
      documentData.documentTypeId,
      documentData.documentNumber,
      documentData.fileName,
      documentData.originalFileName,
      documentData.filePath,
      documentData.fileSize,
      documentData.mimeType,
      documentData.fileHash,
      documentData.expiryDate,
      documentData.notes,
      documentData.metadata
    );
  }

  getDocument(documentId: number) {
    const stmt = this.db.prepare(`
      SELECT d.*, dt.typeName, dt.displayName as typeDisplayName, dt.category,
             e.entityType, e.externalEntityId, e.entityName
      FROM documents d
      JOIN document_types dt ON d.documentTypeId = dt.id
      JOIN entities e ON d.entityId = e.id
      WHERE d.id = ? AND d.isActive = 1
    `);
    return stmt.get(documentId);
  }

  getDocumentsByEntity(entityType: string, externalEntityId: number, documentType?: string) {
    let query = `
      SELECT d.*, dt.typeName, dt.displayName as typeDisplayName, dt.category
      FROM documents d
      JOIN document_types dt ON d.documentTypeId = dt.id
      JOIN entities e ON d.entityId = e.id
      WHERE e.entityType = ? AND e.externalEntityId = ? AND d.isActive = 1
    `;
    const params: any[] = [entityType, externalEntityId];
    
    if (documentType) {
      query += ' AND dt.typeName = ?';
      params.push(documentType);
    }
    
    query += ' ORDER BY d.uploadedAt DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  updateDocument(documentId: number, updates: {
    documentNumber?: string;
    isVerified?: number;
    verifiedBy?: string;
    verifiedAt?: string;
    notes?: string;
    metadata?: string;
  }) {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return null;
    
    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(documentId);
    
    const stmt = this.db.prepare(`
      UPDATE documents SET ${fields.join(', ')} WHERE id = ?
    `);
    return stmt.run(...values);
  }

  deleteDocument(documentId: number, softDelete: boolean = true) {
    if (softDelete) {
      const stmt = this.db.prepare(`
        UPDATE documents SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
      `);
      return stmt.run(documentId);
    } else {
      const stmt = this.db.prepare('DELETE FROM documents WHERE id = ?');
      return stmt.run(documentId);
    }
  }

  // Access logging
  logAccess(documentId: number, accessType: string, accessedBy?: string, ipAddress?: string, userAgent?: string, success: boolean = true, errorMessage?: string) {
    const stmt = this.db.prepare(`
      INSERT INTO document_access_log (
        documentId, accessType, accessedBy, ipAddress, userAgent, success, errorMessage
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(documentId, accessType, accessedBy, ipAddress, userAgent, success ? 1 : 0, errorMessage);
  }

  // Document audit logging
  logAudit(auditData: {
    documentId: number;
    operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'VERIFY' | 'UNVERIFY';
    tableName?: string;
    recordId: number;
    oldValues?: any;
    newValues?: any;
    changedFields?: string[];
    userId?: string;
    userRole?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
  }) {
    const stmt = this.db.prepare(`
      INSERT INTO document_audit (
        documentId, operation, tableName, recordId, oldValues, newValues, 
        changedFields, userId, userRole, sessionId, ipAddress, userAgent, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      auditData.documentId,
      auditData.operation,
      auditData.tableName || 'documents',
      auditData.recordId,
      auditData.oldValues ? JSON.stringify(auditData.oldValues) : null,
      auditData.newValues ? JSON.stringify(auditData.newValues) : null,
      auditData.changedFields ? JSON.stringify(auditData.changedFields) : null,
      auditData.userId,
      auditData.userRole,
      auditData.sessionId,
      auditData.ipAddress,
      auditData.userAgent,
      auditData.reason
    );
  }

  // Get audit trail for a document
  getDocumentAuditTrail(documentId: number, limit?: number) {
    let query = `
      SELECT * FROM document_audit 
      WHERE documentId = ? 
      ORDER BY timestamp DESC
    `;
    const params: any[] = [documentId];
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  // Get audit trail by user
  getAuditTrailByUser(userId: string, limit?: number) {
    let query = `
      SELECT da.*, d.fileName, d.documentType 
      FROM document_audit da
      JOIN documents d ON da.documentId = d.id
      WHERE da.userId = ? 
      ORDER BY da.timestamp DESC
    `;
    const params: any[] = [userId];
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  // Get audit statistics
  getAuditStats(fromDate?: string, toDate?: string) {
    let query = `
      SELECT 
        operation,
        COUNT(*) as count,
        COUNT(DISTINCT documentId) as uniqueDocuments,
        COUNT(DISTINCT userId) as uniqueUsers
      FROM document_audit
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (fromDate) {
      query += ' AND timestamp >= ?';
      params.push(fromDate);
    }
    
    if (toDate) {
      query += ' AND timestamp <= ?';
      params.push(toDate);
    }
    
    query += ' GROUP BY operation ORDER BY count DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  // Search and filtering
  searchDocuments(searchParams: {
    entityType?: string;
    externalEntityId?: number;
    documentType?: string;
    isVerified?: boolean;
    hasExpiry?: boolean;
    expiringBefore?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = `
      SELECT d.*, dt.typeName, dt.displayName as typeDisplayName, dt.category,
             e.entityType, e.externalEntityId, e.entityName
      FROM documents d
      JOIN document_types dt ON d.documentTypeId = dt.id
      JOIN entities e ON d.entityId = e.id
      WHERE d.isActive = 1
    `;
    const params: any[] = [];
    
    if (searchParams.entityType) {
      query += ' AND e.entityType = ?';
      params.push(searchParams.entityType);
    }
    
    if (searchParams.externalEntityId) {
      query += ' AND e.externalEntityId = ?';
      params.push(searchParams.externalEntityId);
    }
    
    if (searchParams.documentType) {
      query += ' AND dt.typeName = ?';
      params.push(searchParams.documentType);
    }
    
    if (searchParams.isVerified !== undefined) {
      query += ' AND d.isVerified = ?';
      params.push(searchParams.isVerified ? 1 : 0);
    }
    
    if (searchParams.expiringBefore) {
      query += ' AND d.expiryDate IS NOT NULL AND d.expiryDate <= ?';
      params.push(searchParams.expiringBefore);
    }
    
    query += ' ORDER BY d.uploadedAt DESC';
    
    if (searchParams.limit) {
      query += ' LIMIT ?';
      params.push(searchParams.limit);
      
      if (searchParams.offset) {
        query += ' OFFSET ?';
        params.push(searchParams.offset);
      }
    }
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }
}

// Initialize database when this module is imported
initializeDatabase();

export default DocumentsDB;
