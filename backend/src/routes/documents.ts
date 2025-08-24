import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DocumentRepository } from '../database/documents';

const router = Router();
const documentRepo = new DocumentRepository();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG, GIF) and PDF files are allowed'));
    }
  }
});

// Upload document for client
router.post('/upload/:entityType/:entityId', upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { entityType, entityId } = req.params;
    const { documentType, documentNumber, expiryDate, notes } = req.body;

    // Validate entity type
    if (!['client', 'account'].includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entity type. Must be "client" or "account"'
      });
    }

    // Validate document type
    const validDocumentTypes = [
      'pan_card', 'aadhar_card', 'passport', 'driving_license', 'voter_id',
      'passbook_page', 'statement', 'cheque_leaf', 'fd_receipt', 'loan_document'
    ];

    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document type'
      });
    }

    const document = documentRepo.create({
      entityType: entityType as 'client' | 'account',
      entityId: parseInt(entityId),
      documentType,
      documentNumber: documentNumber || null,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      expiryDate: expiryDate || null,
      notes: notes || null,
      isVerified: 0,
      isActive: 1
    });

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get documents for an entity
router.get('/:entityType/:entityId', (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    if (!['client', 'account'].includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entity type'
      });
    }

    const documents = documentRepo.getByEntity(
      entityType as 'client' | 'account',
      parseInt(entityId)
    );

    res.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific document by ID
router.get('/file/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const document = documentRepo.getById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Verify document
router.put('/verify/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { verifiedBy } = req.body;

    if (!verifiedBy) {
      return res.status(400).json({
        success: false,
        error: 'verifiedBy is required'
      });
    }

    const success = documentRepo.verify(id, verifiedBy);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Document verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to verify document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete document
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = documentRepo.delete(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
