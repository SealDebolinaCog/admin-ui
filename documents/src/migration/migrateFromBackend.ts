import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import DocumentsDB from '../database/database';
import crypto from 'crypto';

interface BackendDocument {
  id: number;
  entityType: string;
  entityId: number;
  documentType: string;
  documentNumber?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  updatedAt: string;
  expiryDate?: string;
  isVerified: number;
  isActive: number;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

interface BackendClient {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
}

export class DocumentMigration {
  private backendDb: Database.Database;
  private documentsDb: DocumentsDB;
  private backendUploadsPath: string;
  private documentsUploadsPath: string;

  constructor() {
    // Connect to backend database
    const backendDbPath = path.join(__dirname, '../../../backend/data/admin_ui.db');
    this.backendDb = new Database(backendDbPath);
    
    // Connect to documents database
    this.documentsDb = new DocumentsDB();
    
    // Set upload paths
    this.backendUploadsPath = path.join(__dirname, '../../../backend/uploads');
    this.documentsUploadsPath = path.join(__dirname, '../../uploads');
    
    // Ensure documents uploads directory exists
    if (!fs.existsSync(this.documentsUploadsPath)) {
      fs.mkdirSync(this.documentsUploadsPath, { recursive: true });
    }
  }

  private generateFileHash(filePath: string): string | null {
    try {
      const buffer = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(buffer).digest('hex');
    } catch (error) {
      console.error(`Error generating hash for ${filePath}:`, error);
      return null;
    }
  }

  private getClientName(clientId: number): string {
    try {
      const stmt = this.backendDb.prepare('SELECT firstName, middleName, lastName FROM clients WHERE id = ?');
      const client = stmt.get(clientId) as BackendClient;
      
      if (client) {
        const parts = [client.firstName, client.middleName, client.lastName].filter(Boolean);
        return parts.join(' ');
      }
      
      return `Client ${clientId}`;
    } catch (error) {
      console.error(`Error getting client name for ID ${clientId}:`, error);
      return `Client ${clientId}`;
    }
  }

  private copyFile(sourcePath: string, destPath: string): boolean {
    try {
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      fs.copyFileSync(sourcePath, destPath);
      return true;
    } catch (error) {
      console.error(`Error copying file from ${sourcePath} to ${destPath}:`, error);
      return false;
    }
  }

  async migrateDocuments(): Promise<{ success: number; failed: number; skipped: number }> {
    console.log('Starting document migration from backend to Documents module...');
    
    let success = 0;
    let failed = 0;
    let skipped = 0;

    try {
      // Get all documents from backend database
      const stmt = this.backendDb.prepare(`
        SELECT * FROM documents 
        WHERE isActive = 1 
        ORDER BY uploadedAt ASC
      `);
      const backendDocuments = stmt.all() as BackendDocument[];
      
      console.log(`Found ${backendDocuments.length} documents to migrate`);

      for (const doc of backendDocuments) {
        try {
          console.log(`Migrating document ${doc.id}: ${doc.fileName}`);

          // Create or get entity in documents database
          const entityName = doc.entityType === 'client' ? this.getClientName(doc.entityId) : undefined;
          this.documentsDb.createOrUpdateEntity(doc.entityType, doc.entityId, entityName);
          const entity = this.documentsDb.getEntity(doc.entityType, doc.entityId);
          
          if (!entity) {
            console.error(`Failed to create entity for document ${doc.id}`);
            failed++;
            continue;
          }

          // Get document type
          const documentType = this.documentsDb.getDocumentTypeByName(doc.documentType);
          if (!documentType) {
            console.error(`Unknown document type: ${doc.documentType} for document ${doc.id}`);
            failed++;
            continue;
          }

          // Check if document already exists in documents database
          const existingDocs = this.documentsDb.getDocumentsByEntity(
            doc.entityType,
            doc.entityId,
            doc.documentType
          );

          // Skip if document with same filename already exists
          const duplicate = existingDocs.find((existing: any) => existing.fileName === doc.fileName);
          if (duplicate) {
            console.log(`Document ${doc.id} already exists, skipping`);
            skipped++;
            continue;
          }

          // Resolve source file path
          const sourceFilePath = path.isAbsolute(doc.filePath) 
            ? doc.filePath 
            : path.join(this.backendUploadsPath, doc.filePath);

          if (!fs.existsSync(sourceFilePath)) {
            console.error(`Source file not found: ${sourceFilePath} for document ${doc.id}`);
            failed++;
            continue;
          }

          // Generate new file path in documents module
          const entityDir = path.join(this.documentsUploadsPath, doc.entityType, doc.entityId.toString());
          const destFilePath = path.join(entityDir, doc.fileName);
          const relativeDestPath = path.relative(this.documentsUploadsPath, destFilePath);

          // Copy file to documents module uploads directory
          if (!this.copyFile(sourceFilePath, destFilePath)) {
            failed++;
            continue;
          }

          // Generate file hash
          const fileHash = this.generateFileHash(destFilePath);

          // Create document record in documents database
          const documentData = {
            entityId: (entity as any).id,
            documentTypeId: (documentType as any).id,
            documentNumber: doc.documentNumber,
            fileName: doc.fileName,
            originalFileName: doc.fileName, // Use same filename as original
            filePath: relativeDestPath,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            fileHash: fileHash || undefined,
            expiryDate: doc.expiryDate,
            notes: doc.notes,
            metadata: JSON.stringify({
              migratedFrom: 'backend',
              originalId: doc.id,
              originalUploadedAt: doc.uploadedAt
            })
          };

          const result = this.documentsDb.createDocument(documentData);
          const newDocumentId = result.lastInsertRowid as number;

          // Update verification status if verified
          if (doc.isVerified) {
            this.documentsDb.updateDocument(newDocumentId, {
              isVerified: 1,
              verifiedBy: doc.verifiedBy,
              verifiedAt: doc.verifiedAt
            });
          }

          // Log the migration
          this.documentsDb.logAccess(newDocumentId, 'upload', 'migration-script');

          console.log(`Successfully migrated document ${doc.id} -> ${newDocumentId}`);
          success++;

        } catch (error) {
          console.error(`Error migrating document ${doc.id}:`, error);
          failed++;
        }
      }

    } catch (error) {
      console.error('Migration error:', error);
    }

    console.log(`Migration completed: ${success} successful, ${failed} failed, ${skipped} skipped`);
    return { success, failed, skipped };
  }

  async verifyMigration(): Promise<boolean> {
    console.log('Verifying migration...');
    
    try {
      // Count documents in backend
      const backendCount = this.backendDb.prepare('SELECT COUNT(*) as count FROM documents WHERE isActive = 1').get() as { count: number };
      
      // Count documents in documents module
      const documentsCount = this.documentsDb.searchDocuments({ limit: 10000 }).length;
      
      console.log(`Backend documents: ${backendCount.count}`);
      console.log(`Documents module: ${documentsCount}`);
      
      // Count documents in documents module
      const documentsDb = (this.documentsDb as any).db;
      const stmt = documentsDb.prepare('SELECT filePath FROM documents WHERE isActive = 1');
      const documents = stmt.all() as { filePath: string }[];
      
      let missingFiles = 0;
      for (const doc of documents) {
        const fullPath = path.join(this.documentsUploadsPath, doc.filePath);
        if (!fs.existsSync(fullPath)) {
          console.error(`Missing file: ${fullPath}`);
          missingFiles++;
        }
      }
      
      console.log(`Missing files: ${missingFiles}`);
      
      return missingFiles === 0 && documentsCount > 0;
      
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  }

  close() {
    this.backendDb.close();
  }
}

// CLI execution
if (require.main === module) {
  const migration = new DocumentMigration();
  
  migration.migrateDocuments()
    .then(async (result) => {
      console.log('Migration result:', result);
      
      const verified = await migration.verifyMigration();
      console.log('Migration verified:', verified);
      
      migration.close();
      process.exit(verified ? 0 : 1);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      migration.close();
      process.exit(1);
    });
}
