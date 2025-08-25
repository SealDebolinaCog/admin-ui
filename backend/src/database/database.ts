import Database from 'better-sqlite3';
import path from 'path';

// Database file path
const DB_PATH = path.join(__dirname, '../../data/admin_ui.db');

// Create database instance
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
export function initializeDatabase() {
  console.log('Initializing enhanced database with proper normalization...');
  
  // Create ADDRESSES table first (referenced by other tables)
  db.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      addressLine1 TEXT NOT NULL,
      addressLine2 TEXT,
      addressLine3 TEXT,
      city TEXT,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      pincode TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'India',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create INSTITUTIONS table
  db.exec(`
    CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institutionType TEXT NOT NULL CHECK (institutionType IN ('bank', 'post_office')),
      institutionName TEXT NOT NULL,
      branchCode TEXT,
      ifscCode TEXT,
      pinCode TEXT,
      addressId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (addressId) REFERENCES addresses(id) ON DELETE SET NULL
    )
  `);

  // Create enhanced CLIENTS table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      firstName TEXT NOT NULL,
      middleName TEXT,
      lastName TEXT NOT NULL,
      dateOfBirth DATE,
      gender TEXT,
      occupation TEXT,
      kycNumber TEXT,
      panNumber TEXT,
      aadhaarNumber TEXT,
      addressId INTEGER,
      linkedClientId INTEGER,
      linkedClientRelationship TEXT CHECK (linkedClientRelationship IN ('spouse', 'parent', 'child', 'sibling', 'business_partner', 'guarantor', 'other')),
      status TEXT DEFAULT 'active',
      deletionStatus TEXT DEFAULT 'active' CHECK (deletionStatus IN ('active', 'soft_deleted', 'hard_deleted')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (addressId) REFERENCES addresses(id) ON DELETE SET NULL,
      FOREIGN KEY (linkedClientId) REFERENCES clients(id) ON DELETE SET NULL
    )
  `);

  // Create CONTACTS table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('email', 'phone')),
      contactPriority TEXT CHECK (contactPriority IN ('primary', 'secondary')),
      contactDetails TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  // Create enhanced SHOPS table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shopName TEXT NOT NULL,
      shopType TEXT,
      licenseNumber TEXT,
      ownerId INTEGER NOT NULL,
      addressId INTEGER,
      deletionStatus TEXT DEFAULT 'active' CHECK (deletionStatus IN ('active', 'soft_deleted', 'hard_deleted')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ownerId) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (addressId) REFERENCES addresses(id) ON DELETE SET NULL
    )
  `);

  // Create enhanced ACCOUNTS table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountNumber TEXT UNIQUE NOT NULL,
      accountType TEXT NOT NULL CHECK (accountType IN ('savings', 'current', 'fixed_deposit', 'recurring_deposit', 'loan')),
      accountOwnershipType TEXT NOT NULL CHECK (accountOwnershipType IN ('individual', 'joint', 'minor')),
      balance DECIMAL DEFAULT 0.00,
      interestRate DECIMAL,
      maturityDate DATE,
      institutionId INTEGER NOT NULL,
      deletionStatus TEXT DEFAULT 'active' CHECK (deletionStatus IN ('active', 'soft_deleted', 'hard_deleted')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (institutionId) REFERENCES institutions(id) ON DELETE RESTRICT
    )
  `);

  // Create ACCOUNT_HOLDERS junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS account_holders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      clientId INTEGER NOT NULL,
      holderType TEXT NOT NULL CHECK (holderType IN ('primary', 'secondary', 'nominee')),
      sharePercentage DECIMAL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
      UNIQUE(accountId, clientId)
    )
  `);

  // Create SHOP_CLIENTS junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shopId INTEGER NOT NULL,
      clientId INTEGER NOT NULL,
      relationshipType TEXT NOT NULL CHECK (relationshipType IN ('customer', 'supplier', 'partner')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shopId) REFERENCES shops(id) ON DELETE CASCADE,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
      UNIQUE(shopId, clientId)
    )
  `);

  // Create TRANSACTIONS table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      transactionType TEXT NOT NULL CHECK (transactionType IN ('deposit', 'withdrawal', 'transfer', 'interest', 'fee')),
      amount DECIMAL NOT NULL,
      balanceAfter DECIMAL NOT NULL,
      description TEXT,
      referenceNumber TEXT,
      transactionDate DATE NOT NULL,
      status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'cancelled')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);



  // Create AUDIT_LOG table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
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

  // Create comprehensive indexes for performance
  db.exec(`
    -- Address indexes
    CREATE INDEX IF NOT EXISTS idx_addresses_pincode ON addresses(pincode);
    CREATE INDEX IF NOT EXISTS idx_addresses_state_district ON addresses(state, district);
    
    -- Institution indexes
    CREATE INDEX IF NOT EXISTS idx_institutions_type ON institutions(institutionType);
    CREATE INDEX IF NOT EXISTS idx_institutions_ifsc ON institutions(ifscCode);
    CREATE INDEX IF NOT EXISTS idx_institutions_address ON institutions(addressId);
    
    -- Client indexes
    CREATE INDEX IF NOT EXISTS idx_clients_address ON clients(addressId);
    CREATE INDEX IF NOT EXISTS idx_clients_linked ON clients(linkedClientId);
    CREATE INDEX IF NOT EXISTS idx_clients_deletion ON clients(deletionStatus);
    CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(firstName, lastName);
    
    -- Contact indexes
    CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(clientId);
    CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
    CREATE INDEX IF NOT EXISTS idx_contacts_priority ON contacts(contactPriority);
    
    -- Shop indexes
    CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(ownerId);
    CREATE INDEX IF NOT EXISTS idx_shops_address ON shops(addressId);
    CREATE INDEX IF NOT EXISTS idx_shops_license ON shops(licenseNumber);
    CREATE INDEX IF NOT EXISTS idx_shops_deletion ON shops(deletionStatus);
    
    -- Account indexes
    CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(accountNumber);
    CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(accountType);
    CREATE INDEX IF NOT EXISTS idx_accounts_institution ON accounts(institutionId);
    CREATE INDEX IF NOT EXISTS idx_accounts_deletion ON accounts(deletionStatus);
    
    -- Account holder indexes
    CREATE INDEX IF NOT EXISTS idx_account_holders_account ON account_holders(accountId);
    CREATE INDEX IF NOT EXISTS idx_account_holders_client ON account_holders(clientId);
    
    -- Shop client indexes
    CREATE INDEX IF NOT EXISTS idx_shop_clients_shop ON shop_clients(shopId);
    CREATE INDEX IF NOT EXISTS idx_shop_clients_client ON shop_clients(clientId);
    
    -- Transaction indexes
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(accountId);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transactionDate);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transactionType);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    
    
    -- Audit log indexes
    CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_log(tableName, recordId);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_operation ON audit_log(operation);
  `);

  // Add migration for linkedClientRelationship column if it doesn't exist
  try {
    db.exec(`ALTER TABLE clients ADD COLUMN linkedClientRelationship TEXT CHECK (linkedClientRelationship IN ('spouse', 'parent', 'child', 'sibling', 'business_partner', 'guarantor', 'other'))`);
    console.log('Added linkedClientRelationship column to existing clients table');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('linkedClientRelationship column already exists');
    } else {
      console.log('Migration error (likely safe to ignore):', error.message);
    }
  }

  console.log('Enhanced database with proper normalization initialized successfully!');
}

// Get database instance
export function getDatabase(): Database.Database {
  return db;
}

// Close database connection
export function closeDatabase() {
  db.close();
}

// Initialize database when this module is imported
initializeDatabase(); 