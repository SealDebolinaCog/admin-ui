// Database connection module
// Schema follows Enhanced_ER_Model.md

import Database from 'better-sqlite3';
import path from 'path';

// Database file path
const DB_PATH = path.join(__dirname, '../../data/admin_ui.db');

// Create database instance
const db = new Database(DB_PATH);

// Enable foreign keys and WAL mode for better performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize fresh database with enhanced schema
export function initializeDatabase() {
  console.log('Initializing fresh enhanced database schema...');
  
  // Drop existing tables to start fresh
  console.log('Dropping existing tables...');
  db.exec(`DROP TABLE IF EXISTS documents`);
  db.exec(`DROP TABLE IF EXISTS profile_pictures`);
  db.exec(`DROP TABLE IF EXISTS audit_log`);
  db.exec(`DROP TABLE IF EXISTS transactions`);
  db.exec(`DROP TABLE IF EXISTS account_holders`);
  db.exec(`DROP TABLE IF EXISTS shop_clients`);
  db.exec(`DROP TABLE IF EXISTS accounts`);
  db.exec(`DROP TABLE IF EXISTS shops`);
  db.exec(`DROP TABLE IF EXISTS clients`);
  db.exec(`DROP TABLE IF EXISTS institutions`);
  db.exec(`DROP TABLE IF EXISTS addresses`);
  
  console.log('Creating new enhanced schema...');
  
  // Create ADDRESSES table (normalized address storage)
  db.exec(`
    CREATE TABLE addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      addressLine1 TEXT NOT NULL,
      addressLine2 TEXT,
      addressLine3 TEXT,
      state TEXT,
      district TEXT,
      pincode TEXT,
      country TEXT DEFAULT 'India',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create INSTITUTIONS table (banks and post offices)
  db.exec(`
    CREATE TABLE institutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institutionName TEXT NOT NULL,
      institutionType TEXT NOT NULL CHECK (institutionType IN ('bank', 'post_office')),
      branchCode TEXT,
      ifscCode TEXT,
      addressId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (addressId) REFERENCES addresses(id) ON DELETE SET NULL
    )
  `);

  // Create enhanced CLIENTS table with foreign keys
  db.exec(`
    CREATE TABLE clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      firstName TEXT NOT NULL,
      middleName TEXT,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      kycNumber TEXT,
      panNumber TEXT,
      aadhaarNumber TEXT,
      addressId INTEGER,
      status TEXT DEFAULT 'active' CHECK (status IN ('invite_now', 'pending', 'active', 'suspended', 'deleted')),
      linkedClientId INTEGER,
      linkedClientRelationship TEXT,
      deletionStatus BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (addressId) REFERENCES addresses(id) ON DELETE SET NULL,
      FOREIGN KEY (linkedClientId) REFERENCES clients(id) ON DELETE SET NULL
    )
  `);

  // Create enhanced SHOPS table with foreign keys
  db.exec(`
    CREATE TABLE shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shopName TEXT NOT NULL,
      shopType TEXT,
      category TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'inactive')),
      ownerId INTEGER NOT NULL,
      addressId INTEGER,
      ownerEmail TEXT,
      ownerPhone TEXT,
      deletionStatus BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ownerId) REFERENCES clients(id) ON DELETE RESTRICT,
      FOREIGN KEY (addressId) REFERENCES addresses(id) ON DELETE SET NULL
    )
  `);

  // Create enhanced ACCOUNTS table with foreign keys
  db.exec(`
    CREATE TABLE accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountNumber TEXT UNIQUE NOT NULL,
      accountOwnershipType TEXT DEFAULT 'joint' CHECK (accountOwnershipType IN ('single', 'joint')),
      accountType TEXT NOT NULL,
      institutionId INTEGER NOT NULL,
      tenure INTEGER DEFAULT 12,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'fined', 'matured', 'closed')),
      startDate DATE,
      maturityDate DATE,
      paymentType TEXT DEFAULT 'monthly' CHECK (paymentType IN ('monthly', 'annually', 'one_time')),
      amount DECIMAL(15,2) DEFAULT 0,
      lastPaymentDate DATE,
      nomineeName TEXT,
      nomineeRelation TEXT,
      deletionStatus BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (institutionId) REFERENCES institutions(id) ON DELETE RESTRICT
    )
  `);

  // Create ACCOUNT_HOLDERS junction table (many-to-many: accounts <-> clients)
  db.exec(`
    CREATE TABLE account_holders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      clientId INTEGER NOT NULL,
      holderType TEXT DEFAULT 'primary' CHECK (holderType IN ('primary', 'secondary', 'nominee')),
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
      UNIQUE(accountId, clientId, holderType)
    )
  `);

  // Create SHOP_CLIENTS junction table (many-to-many: shops <-> clients)
  db.exec(`
    CREATE TABLE shop_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shopId INTEGER NOT NULL,
      clientId INTEGER NOT NULL,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shopId) REFERENCES shops(id) ON DELETE CASCADE,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
      UNIQUE(shopId, clientId)
    )
  `);

  // Create TRANSACTIONS table (financial transaction history)
  db.exec(`
    CREATE TABLE transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      transactionType TEXT NOT NULL CHECK (transactionType IN ('deposit', 'withdrawal', 'interest', 'penalty', 'maturity')),
      amount DECIMAL(15,2) NOT NULL,
      transactionDate DATE NOT NULL,
      description TEXT,
      referenceNumber TEXT,
      status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // Create AUDIT_LOG table (system-wide audit trail)
  db.exec(`
    CREATE TABLE audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tableName TEXT NOT NULL,
      recordId INTEGER NOT NULL,
      operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'RESTORE')),
      oldValues TEXT, -- JSON string
      newValues TEXT, -- JSON string
      userId TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create PROFILE_PICTURES table for storing images linked to entities
  db.exec(`
    CREATE TABLE profile_pictures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entityType TEXT NOT NULL CHECK (entityType IN ('client', 'shop', 'account')),
      entityId INTEGER NOT NULL,
      imageType TEXT NOT NULL CHECK (imageType IN ('profile', 'outlet', 'front_page')),
      fileName TEXT NOT NULL,
      filePath TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      mimeType TEXT NOT NULL,
      uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      isActive INTEGER DEFAULT 1 CHECK (isActive IN (0, 1)),
      UNIQUE(entityType, entityId, imageType, isActive) -- Only one active image per type per entity
    )
  `);

  // Create DOCUMENTS table for storing client and account documents
  db.exec(`
    CREATE TABLE documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entityType TEXT NOT NULL CHECK (entityType IN ('client', 'account')),
      entityId INTEGER NOT NULL,
      documentType TEXT NOT NULL CHECK (documentType IN ('pan_card', 'aadhar_card', 'passport', 'driving_license', 'voter_id', 'passbook_page', 'statement', 'cheque_leaf', 'fd_receipt', 'loan_document')),
      documentNumber TEXT,
      fileName TEXT NOT NULL,
      filePath TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      mimeType TEXT NOT NULL,
      uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiryDate DATE,
      isVerified INTEGER DEFAULT 0 CHECK (isVerified IN (0, 1)),
      isActive INTEGER DEFAULT 1 CHECK (isActive IN (0, 1)),
      verifiedBy TEXT,
      verifiedAt DATETIME,
      notes TEXT
    )
  `);

  createIndexes();

  console.log('Fresh enhanced database schema initialized successfully!');
}

// Create performance indexes
function createIndexes() {
  console.log('Creating database indexes...');
  
  // Address indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_addresses_location ON addresses(state, district, pincode)`);
  
  // Institution indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_institutions_type ON institutions(institutionType)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_institutions_ifsc ON institutions(ifscCode)`);
  
  // Client indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(firstName, lastName)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_clients_deletion ON clients(deletionStatus)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_clients_linked ON clients(linkedClientId)`);
  
  // Shop indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_shops_name ON shops(shopName)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(ownerId)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_shops_deletion ON shops(deletionStatus)`);
  
  // Account indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(accountNumber)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_institution ON accounts(institutionId)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_deletion ON accounts(deletionStatus)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_dates ON accounts(startDate, maturityDate)`);
  
  // Junction table indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_account_holders_account ON account_holders(accountId)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_account_holders_client ON account_holders(clientId)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_shop_clients_shop ON shop_clients(shopId)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_shop_clients_client ON shop_clients(clientId)`);
  
  // Transaction indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(accountId)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transactionDate)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transactionType)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`);
  
  // Audit log indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_log(tableName, recordId)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_operation ON audit_log(operation)`);
  
  // Profile Pictures indexes
  db.exec(`CREATE INDEX idx_profile_pictures_entity ON profile_pictures(entityType, entityId)`);
  db.exec(`CREATE INDEX idx_profile_pictures_type ON profile_pictures(imageType)`);
  db.exec(`CREATE INDEX idx_profile_pictures_active ON profile_pictures(isActive)`);

  // Documents indexes
  db.exec(`CREATE INDEX idx_documents_entity ON documents(entityType, entityId)`);
  db.exec(`CREATE INDEX idx_documents_type ON documents(documentType)`);
  db.exec(`CREATE INDEX idx_documents_number ON documents(documentNumber)`);
  db.exec(`CREATE INDEX idx_documents_verified ON documents(isVerified)`);
  db.exec(`CREATE INDEX idx_documents_active ON documents(isActive)`);
  db.exec(`CREATE INDEX idx_documents_expiry ON documents(expiryDate)`);

  console.log('Database indexes created successfully!');
}

// Get database instance
export function getDatabase(): Database.Database {
  return db;
}

// Close database connection
export function closeDatabase() {
  db.close();
}

// Initialize database with clean schema (no mock data)
initializeDatabase(); 