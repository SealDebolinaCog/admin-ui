import express from 'express';
import multer from 'multer';
import DocumentService from '../services/documentService';
import fs from 'fs';

const router = express.Router();
const documentService = new DocumentService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  }
});

// Get document types
router.get('/types', async (req, res) => {
  try {
    const category = req.query.category as string;
    const documentTypes = documentService.getDocumentTypes(category);
    res.json(documentTypes);
  } catch (error: any) {
    console.error('Get document types error:', error);
    res.status(500).json({ error: 'Failed to get document types' });
  }
});

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      entityType,
      externalEntityId,
      entityName,
      documentType,
      documentNumber,
      expiryDate,
      notes,
      metadata
    } = req.body;

    if (!entityType || !externalEntityId || !documentType) {
      return res.status(400).json({ 
        error: 'Missing required fields: entityType, externalEntityId, documentType' 
      });
    }

    const uploadData = {
      entityType,
      externalEntityId: parseInt(externalEntityId),
      entityName,
      documentType,
      documentNumber,
      file: {
        originalname: req.file.originalname,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      expiryDate,
      notes,
      metadata: metadata ? JSON.parse(metadata) : null,
      uploadedBy: req.headers['x-user-id'] as string || 'system'
    };

    const document = await documentService.uploadDocument(uploadData);
    res.status(201).json(document);
  } catch (error: any) {
    console.error('Document upload error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get documents by entity
router.get('/entity/:entityType/:externalEntityId', async (req, res) => {
  try {
    const { entityType, externalEntityId } = req.params;
    const documentType = req.query.documentType as string;

    const documents = documentService.getDocumentsByEntity(
      entityType,
      parseInt(externalEntityId),
      documentType
    );

    res.json(documents);
  } catch (error: any) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// Get single document
router.get('/:documentId', async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId);
    const document = documentService.getDocument(documentId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error: any) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

// Update document
router.put('/:documentId', async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId);
    const updateData = req.body;
    const updatedBy = req.headers['x-user-id'] as string || 'system';

    const document = documentService.updateDocument(documentId, updateData, updatedBy);

    if (!document) {
      return res.status(404).json({ error: 'Document not found or no changes made' });
    }

    res.json(document);
  } catch (error: any) {
    console.error('Update document error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete document
router.delete('/:documentId', async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId);
    const hardDelete = req.query.hard === 'true';
    const deletedBy = req.headers['x-user-id'] as string || 'system';

    const success = documentService.deleteDocument(documentId, deletedBy, hardDelete);

    if (!success) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// View document (inline)
router.get('/:documentId/view', async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId);
    const accessedBy = req.headers['x-user-id'] as string || 'anonymous';
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = documentService.getDocumentFile(documentId, accessedBy, ipAddress, userAgent);

    if (!result) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { filePath, document } = result;

    // Set appropriate headers for inline viewing
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalFileName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      res.status(500).json({ error: 'Failed to read file' });
    });

    fileStream.pipe(res);
  } catch (error: any) {
    console.error('View document error:', error);
    res.status(500).json({ error: 'Failed to view document' });
  }
});

// Download document
router.get('/:documentId/download', async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId);
    const accessedBy = req.headers['x-user-id'] as string || 'anonymous';
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = documentService.downloadDocument(documentId, accessedBy, ipAddress, userAgent);

    if (!result) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { filePath, document } = result;

    // Set appropriate headers for download
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalFileName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      res.status(500).json({ error: 'Failed to read file' });
    });

    fileStream.pipe(res);
  } catch (error: any) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Search documents
router.get('/search', async (req, res) => {
  try {
    const searchParams = {
      entityType: req.query.entityType as string,
      externalEntityId: req.query.externalEntityId ? parseInt(req.query.externalEntityId as string) : undefined,
      documentType: req.query.documentType as string,
      isVerified: req.query.isVerified ? req.query.isVerified === 'true' : undefined,
      expiringBefore: req.query.expiringBefore as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    const documents = documentService.searchDocuments(searchParams);
    res.json(documents);
  } catch (error: any) {
    console.error('Search documents error:', error);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

// Get expiring documents
router.get('/expiring/:days', async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const documents = documentService.getExpiringDocuments(days);
    res.json(documents);
  } catch (error: any) {
    console.error('Get expiring documents error:', error);
    res.status(500).json({ error: 'Failed to get expiring documents' });
  }
});

// Get document statistics
router.get('/stats', async (req, res) => {
  try {
    const entityType = req.query.entityType as string;
    const stats = documentService.getDocumentStats(entityType);
    res.json(stats);
  } catch (error: any) {
    console.error('Get document stats error:', error);
    res.status(500).json({ error: 'Failed to get document statistics' });
  }
});

// Get document audit trail
router.get('/:documentId/audit', async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const auditTrail = documentService.getDocumentAuditTrail(documentId, limit);
    res.json(auditTrail);
  } catch (error: any) {
    console.error('Get audit trail error:', error);
    res.status(500).json({ error: 'Failed to get audit trail' });
  }
});

// Get audit trail by user
router.get('/audit/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const auditTrail = documentService.getAuditTrailByUser(userId, limit);
    res.json(auditTrail);
  } catch (error: any) {
    console.error('Get user audit trail error:', error);
    res.status(500).json({ error: 'Failed to get user audit trail' });
  }
});

// Get audit statistics
router.get('/audit/stats', async (req, res) => {
  try {
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    const stats = documentService.getAuditStats(fromDate, toDate);
    res.json(stats);
  } catch (error: any) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: 'Failed to get audit statistics' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'documents', timestamp: new Date().toISOString() });
});

export default router;
