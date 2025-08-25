-- Documents Module Database Schema
-- This is a separate database for the Documents microservice

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Create ENTITIES table to track what entities documents belong to
CREATE TABLE IF NOT EXISTS entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entityType TEXT NOT NULL CHECK (entityType IN ('client', 'shop', 'account', 'institution')),
    externalEntityId INTEGER NOT NULL, -- ID from the main admin_ui database
    entityName TEXT, -- Optional name for easier identification
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entityType, externalEntityId)
);

-- Create DOCUMENT_TYPES table for extensible document type management
CREATE TABLE IF NOT EXISTS document_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    typeName TEXT UNIQUE NOT NULL,
    displayName TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('identity', 'financial', 'business', 'profile')),
    requiresNumber INTEGER DEFAULT 0, -- Whether this document type requires a document number
    hasExpiry INTEGER DEFAULT 0, -- Whether this document type has an expiry date
    maxFileSize INTEGER DEFAULT 10485760, -- Max file size in bytes (default 10MB)
    allowedMimeTypes TEXT NOT NULL, -- JSON array of allowed MIME types
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create DOCUMENTS table
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entityId INTEGER NOT NULL,
    documentTypeId INTEGER NOT NULL,
    documentNumber TEXT, -- PAN number, Aadhaar number, etc.
    fileName TEXT NOT NULL,
    originalFileName TEXT NOT NULL, -- Store original filename for user reference
    filePath TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    mimeType TEXT NOT NULL,
    fileHash TEXT, -- SHA-256 hash for duplicate detection and integrity
    uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiryDate DATE,
    isVerified INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    verifiedBy TEXT,
    verifiedAt DATETIME,
    notes TEXT,
    metadata TEXT, -- JSON field for additional document metadata
    FOREIGN KEY (entityId) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (documentTypeId) REFERENCES document_types(id) ON DELETE RESTRICT
);

-- Create DOCUMENT_VERSIONS table for version history
CREATE TABLE IF NOT EXISTS document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    documentId INTEGER NOT NULL,
    versionNumber INTEGER NOT NULL,
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    mimeType TEXT NOT NULL,
    fileHash TEXT,
    uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    uploadedBy TEXT,
    changeReason TEXT,
    isActive INTEGER DEFAULT 0, -- Only current version should be active
    FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE,
    UNIQUE(documentId, versionNumber)
);

-- Create DOCUMENT_ACCESS_LOG table for audit trail
CREATE TABLE IF NOT EXISTS document_access_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    documentId INTEGER NOT NULL,
    accessType TEXT NOT NULL CHECK (accessType IN ('view', 'download', 'upload', 'update', 'delete')),
    accessedBy TEXT,
    accessedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ipAddress TEXT,
    userAgent TEXT,
    success INTEGER DEFAULT 1,
    errorMessage TEXT,
    FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
);

-- Create DOCUMENT_AUDIT table for comprehensive change tracking
CREATE TABLE IF NOT EXISTS document_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    documentId INTEGER NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'VERIFY', 'UNVERIFY')),
    tableName TEXT NOT NULL DEFAULT 'documents',
    recordId INTEGER NOT NULL,
    oldValues TEXT, -- JSON string of previous values
    newValues TEXT, -- JSON string of new values
    changedFields TEXT, -- JSON array of field names that changed
    userId TEXT,
    userRole TEXT,
    sessionId TEXT,
    ipAddress TEXT,
    userAgent TEXT,
    reason TEXT, -- Reason for the change
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
);

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_entities_type_external ON entities(entityType, externalEntityId);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entityType);

CREATE INDEX IF NOT EXISTS idx_document_types_category ON document_types(category);
CREATE INDEX IF NOT EXISTS idx_document_types_active ON document_types(isActive);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entityId);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(documentTypeId);
CREATE INDEX IF NOT EXISTS idx_documents_number ON documents(documentNumber);
CREATE INDEX IF NOT EXISTS idx_documents_verified ON documents(isVerified);
CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(isActive);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiryDate);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(fileHash);

CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(documentId);
CREATE INDEX IF NOT EXISTS idx_document_versions_active ON document_versions(isActive);

CREATE INDEX IF NOT EXISTS idx_access_log_document ON document_access_log(documentId);
CREATE INDEX IF NOT EXISTS idx_access_log_type ON document_access_log(accessType);
CREATE INDEX IF NOT EXISTS idx_access_log_timestamp ON document_access_log(accessedAt);

CREATE INDEX IF NOT EXISTS idx_audit_document ON document_audit(documentId);
CREATE INDEX IF NOT EXISTS idx_audit_operation ON document_audit(operation);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON document_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user ON document_audit(userId);
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON document_audit(tableName, recordId);

-- Insert default document types
INSERT OR IGNORE INTO document_types (typeName, displayName, category, requiresNumber, hasExpiry, allowedMimeTypes) VALUES
('pan_card', 'PAN Card', 'identity', 1, 0, '["application/pdf", "image/jpeg", "image/png"]'),
('aadhar_card', 'Aadhaar Card', 'identity', 1, 0, '["application/pdf", "image/jpeg", "image/png"]'),
('passport', 'Passport', 'identity', 1, 1, '["application/pdf", "image/jpeg", "image/png"]'),
('driving_license', 'Driving License', 'identity', 1, 1, '["application/pdf", "image/jpeg", "image/png"]'),
('voter_id', 'Voter ID', 'identity', 1, 0, '["application/pdf", "image/jpeg", "image/png"]'),
('passbook_page', 'Bank Passbook Page', 'financial', 0, 0, '["application/pdf", "image/jpeg", "image/png"]'),
('bank_statement', 'Bank Statement', 'financial', 0, 0, '["application/pdf"]'),
('cheque_leaf', 'Cheque Leaf', 'financial', 0, 0, '["application/pdf", "image/jpeg", "image/png"]'),
('fd_receipt', 'Fixed Deposit Receipt', 'financial', 1, 1, '["application/pdf", "image/jpeg", "image/png"]'),
('loan_document', 'Loan Document', 'financial', 1, 0, '["application/pdf"]'),
('business_license', 'Business License', 'business', 1, 1, '["application/pdf", "image/jpeg", "image/png"]'),
('gst_certificate', 'GST Certificate', 'business', 1, 0, '["application/pdf", "image/jpeg", "image/png"]'),
('profile_picture', 'Profile Picture', 'profile', 0, 0, '["image/jpeg", "image/png", "image/webp"]'),
('shop_photo', 'Shop Photo', 'profile', 0, 0, '["image/jpeg", "image/png", "image/webp"]');
