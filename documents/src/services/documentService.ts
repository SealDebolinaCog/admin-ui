import DocumentsDB from '../database/database';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentUploadData {
  entityType: string;
  externalEntityId: number;
  entityName?: string;
  documentType: string;
  documentNumber?: string;
  file: {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
  };
  expiryDate?: string;
  notes?: string;
  metadata?: any;
  uploadedBy?: string;
}

export interface DocumentUpdateData {
  documentNumber?: string;
  isVerified?: boolean;
  verifiedBy?: string;
  notes?: string;
  metadata?: any;
}

export class DocumentService {
  private db: DocumentsDB;
  private uploadsDir: string;

  constructor() {
    this.db = new DocumentsDB();
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.ensureUploadsDirectory();
  }

  private ensureUploadsDirectory() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private generateFileName(originalName: string, documentType: string): string {
    const ext = path.extname(originalName);
    const uuid = uuidv4();
    return `${documentType}_${uuid}${ext}`;
  }

  private getFilePath(entityType: string, externalEntityId: number, fileName: string): string {
    const entityDir = path.join(this.uploadsDir, entityType, externalEntityId.toString());
    if (!fs.existsSync(entityDir)) {
      fs.mkdirSync(entityDir, { recursive: true });
    }
    return path.join(entityDir, fileName);
  }

  async uploadDocument(uploadData: DocumentUploadData): Promise<any> {
    try {
      // Validate document type
      const documentType = this.db.getDocumentTypeByName(uploadData.documentType) as any;
      if (!documentType) {
        throw new Error(`Invalid document type: ${uploadData.documentType}`);
      }

      // Validate file size
      if (uploadData.file.size > documentType.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${documentType.maxFileSize} bytes`);
      }

      // Validate MIME type
      const allowedMimeTypes = JSON.parse(documentType.allowedMimeTypes);
      if (!allowedMimeTypes.includes(uploadData.file.mimetype)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
      }

      // Create or update entity
      this.db.createOrUpdateEntity(
        uploadData.entityType,
        uploadData.externalEntityId,
        uploadData.entityName
      );

      const entity = this.db.getEntity(uploadData.entityType, uploadData.externalEntityId) as any;
      if (!entity) {
        throw new Error('Failed to create entity');
      }

      // Generate file hash for duplicate detection
      const fileHash = this.generateFileHash(uploadData.file.buffer);

      // Check for existing document with same hash
      const existingDocs = this.db.getDocumentsByEntity(
        uploadData.entityType,
        uploadData.externalEntityId,
        uploadData.documentType
      );

      const duplicateDoc = existingDocs.find((doc: any) => doc.fileHash === fileHash);
      if (duplicateDoc) {
        throw new Error('Document with identical content already exists');
      }

      // Generate unique filename and save file
      const fileName = this.generateFileName(uploadData.file.originalname, uploadData.documentType);
      const filePath = this.getFilePath(uploadData.entityType, uploadData.externalEntityId, fileName);

      fs.writeFileSync(filePath, uploadData.file.buffer);

      // Store document metadata in database
      const documentData = {
        entityId: entity.id,
        documentTypeId: documentType.id,
        documentNumber: uploadData.documentNumber,
        fileName,
        originalFileName: uploadData.file.originalname,
        filePath: path.relative(this.uploadsDir, filePath),
        fileSize: uploadData.file.size,
        mimeType: uploadData.file.mimetype,
        fileHash,
        expiryDate: uploadData.expiryDate,
        notes: uploadData.notes,
        metadata: uploadData.metadata ? JSON.stringify(uploadData.metadata) : undefined
      };

      const result = this.db.createDocument(documentData);
      const documentId = result.lastInsertRowid as number;

      // Log access
      this.db.logAccess(documentId, 'upload', uploadData.uploadedBy);

      // Log audit trail
      this.db.logAudit({
        documentId,
        operation: 'CREATE',
        recordId: documentId,
        newValues: documentData,
        userId: uploadData.uploadedBy,
        reason: 'Document uploaded'
      });

      return this.getDocument(documentId);
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }

  getDocument(documentId: number): any {
    return this.db.getDocument(documentId);
  }

  getDocumentsByEntity(entityType: string, externalEntityId: number, documentType?: string): any[] {
    return this.db.getDocumentsByEntity(entityType, externalEntityId, documentType);
  }

  updateDocument(documentId: number, updateData: DocumentUpdateData, updatedBy?: string): any {
    // Get current document for audit trail
    const currentDoc = this.getDocument(documentId);
    if (!currentDoc) return null;

    const updates: any = {};
    const changedFields: string[] = [];

    if (updateData.documentNumber !== undefined) {
      updates.documentNumber = updateData.documentNumber;
      changedFields.push('documentNumber');
    }

    if (updateData.isVerified !== undefined) {
      updates.isVerified = updateData.isVerified ? 1 : 0;
      changedFields.push('isVerified');
      if (updateData.isVerified) {
        updates.verifiedBy = updatedBy;
        updates.verifiedAt = new Date().toISOString();
        changedFields.push('verifiedBy', 'verifiedAt');
      }
    }

    if (updateData.notes !== undefined) {
      updates.notes = updateData.notes;
      changedFields.push('notes');
    }

    if (updateData.metadata !== undefined) {
      updates.metadata = JSON.stringify(updateData.metadata);
      changedFields.push('metadata');
    }

    const result = this.db.updateDocument(documentId, updates);
    
    if (result && result.changes > 0) {
      this.db.logAccess(documentId, 'update', updatedBy);
      
      // Log audit trail
      this.db.logAudit({
        documentId,
        operation: updateData.isVerified !== undefined ? 
          (updateData.isVerified ? 'VERIFY' : 'UNVERIFY') : 'UPDATE',
        recordId: documentId,
        oldValues: currentDoc,
        newValues: updates,
        changedFields,
        userId: updatedBy,
        reason: `Document ${updateData.isVerified !== undefined ? 
          (updateData.isVerified ? 'verified' : 'unverified') : 'updated'}`
      });
      
      return this.getDocument(documentId);
    }

    return null;
  }

  deleteDocument(documentId: number, deletedBy?: string, hardDelete: boolean = false): boolean {
    const document = this.getDocument(documentId);
    if (!document) {
      return false;
    }

    const result = this.db.deleteDocument(documentId, !hardDelete);
    
    if (result && result.changes > 0) {
      this.db.logAccess(documentId, 'delete', deletedBy);
      
      // If hard delete, also remove the physical file
      if (hardDelete) {
        try {
          const fullPath = path.join(this.uploadsDir, document.filePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (error) {
          console.error('Error deleting physical file:', error);
        }
      }
      
      return true;
    }

    return false;
  }

  getDocumentFile(documentId: number, accessedBy?: string, ipAddress?: string, userAgent?: string): { filePath: string; document: any } | null {
    const document = this.getDocument(documentId);
    if (!document) {
      return null;
    }

    const fullPath = path.join(this.uploadsDir, document.filePath);
    
    if (!fs.existsSync(fullPath)) {
      this.db.logAccess(documentId, 'view', accessedBy, ipAddress, userAgent, false, 'File not found');
      return null;
    }

    this.db.logAccess(documentId, 'view', accessedBy, ipAddress, userAgent);
    
    return {
      filePath: fullPath,
      document
    };
  }

  downloadDocument(documentId: number, accessedBy?: string, ipAddress?: string, userAgent?: string): { filePath: string; document: any } | null {
    const document = this.getDocument(documentId);
    if (!document) {
      return null;
    }

    const fullPath = path.join(this.uploadsDir, document.filePath);
    
    if (!fs.existsSync(fullPath)) {
      this.db.logAccess(documentId, 'download', accessedBy, ipAddress, userAgent, false, 'File not found');
      return null;
    }

    this.db.logAccess(documentId, 'download', accessedBy, ipAddress, userAgent);
    
    return {
      filePath: fullPath,
      document
    };
  }

  searchDocuments(searchParams: {
    entityType?: string;
    externalEntityId?: number;
    documentType?: string;
    isVerified?: boolean;
    expiringBefore?: string;
    limit?: number;
    offset?: number;
  }): any[] {
    return this.db.searchDocuments(searchParams);
  }

  getDocumentTypes(category?: string): any[] {
    return this.db.getDocumentTypes(category);
  }

  getExpiringDocuments(days: number = 30): any[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.db.searchDocuments({
      expiringBefore: futureDate.toISOString().split('T')[0],
      limit: 100
    });
  }

  getDocumentStats(entityType?: string): any {
    const db = this.db['db']; // Access the internal db instance
    
    let query = `
      SELECT 
        dt.category,
        dt.displayName,
        COUNT(d.id) as count,
        SUM(d.fileSize) as totalSize,
        COUNT(CASE WHEN d.isVerified = 1 THEN 1 END) as verifiedCount
      FROM document_types dt
      LEFT JOIN documents d ON dt.id = d.documentTypeId AND d.isActive = 1
    `;
    
    const params: any[] = [];
    
    if (entityType) {
      query += `
        LEFT JOIN entities e ON d.entityId = e.id
        WHERE e.entityType = ?
      `;
      params.push(entityType);
    }
    
    query += `
      GROUP BY dt.id, dt.category, dt.displayName
      ORDER BY dt.category, dt.displayName
    `;
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  // Audit trail methods
  getDocumentAuditTrail(documentId: number, limit?: number): any[] {
    return this.db.getDocumentAuditTrail(documentId, limit);
  }

  getAuditTrailByUser(userId: string, limit?: number): any[] {
    return this.db.getAuditTrailByUser(userId, limit);
  }

  getAuditStats(fromDate?: string, toDate?: string): any[] {
    return this.db.getAuditStats(fromDate, toDate);
  }
}

export default DocumentService;
