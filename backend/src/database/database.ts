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
  console.log('Initializing database...');
  
  // Create clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      kycNumber TEXT,
      panNumber TEXT,
      aadhaarNumber TEXT,
      addressLine1 TEXT,
      addressLine2 TEXT,
      addressLine3 TEXT,
      state TEXT,
      district TEXT,
      pincode TEXT,
      country TEXT DEFAULT 'India',
      status TEXT DEFAULT 'active' CHECK (status IN ('invite_now', 'pending', 'active', 'suspended', 'deleted')),
      linkedClientId TEXT,
      linkedClientName TEXT,
      linkedClientRelationship TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrate existing database - remove nominee columns if they exist
  try {
    // Check if old columns exist
    const tableInfo = db.prepare("PRAGMA table_info(clients)").all();
    const hasNomineeName = tableInfo.some((col: any) => col.name === 'nomineeName');
    const hasNomineeRelation = tableInfo.some((col: any) => col.name === 'nomineeRelation');
    
    if (hasNomineeName || hasNomineeRelation) {
      console.log('Migrating database schema - removing nominee columns...');
      
      // Create new table with correct schema
      db.exec(`
        CREATE TABLE clients_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          email TEXT UNIQUE,
          phone TEXT,
          kycNumber TEXT,
          panNumber TEXT,
          aadhaarNumber TEXT,
          addressLine1 TEXT,
          addressLine2 TEXT,
          addressLine3 TEXT,
          state TEXT,
          district TEXT,
          pincode TEXT,
          country TEXT DEFAULT 'India',
          status TEXT DEFAULT 'active' CHECK (status IN ('invite_now', 'pending', 'active', 'suspended', 'deleted')),
          linkedClientId TEXT,
          linkedClientName TEXT,
          linkedClientRelationship TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Copy data from old table to new table
      db.exec(`
        INSERT INTO clients_new (
          id, firstName, lastName, email, phone, kycNumber, panNumber, aadhaarNumber,
          addressLine1, addressLine2, addressLine3, state, district, pincode, country, status, createdAt, updatedAt,
          linkedClientId, linkedClientName, linkedClientRelationship
        )
        SELECT 
          id, firstName, lastName, email, phone, kycNumber, panNumber, aadhaarNumber,
          addressLine1, addressLine2, addressLine3, state, district, pincode, country, status, createdAt, updatedAt,
          NULL, NULL, NULL
        FROM clients
      `);
      
      // Drop old table and rename new table
      db.exec('DROP TABLE clients');
      db.exec('ALTER TABLE clients_new RENAME TO clients');
      
      console.log('Database migration completed successfully');
    } else {
      console.log('Database schema is already up to date');
    }
  } catch (error) {
    console.log('Database migration not needed or failed:', error);
  }

  // Create shops table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shopName TEXT NOT NULL,
      shopType TEXT,
      category TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'inactive')),
      ownerName TEXT NOT NULL,
      ownerEmail TEXT,
      ownerPhone TEXT,
      addressLine1 TEXT,
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

  // Create accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountNumber TEXT UNIQUE NOT NULL,
      accountOwnershipType TEXT DEFAULT 'joint' CHECK (accountOwnershipType IN ('single', 'joint')),
      accountHolderNames TEXT NOT NULL, -- JSON array of names
      institutionType TEXT DEFAULT 'post_office' CHECK (institutionType IN ('bank', 'post_office')),
      accountType TEXT NOT NULL,
      institutionName TEXT NOT NULL,
      branchCode TEXT,
      ifscCode TEXT,
      tenure INTEGER DEFAULT 12, -- in months
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'fined', 'matured', 'closed')),
      startDate TEXT,
      maturityDate TEXT,
      paymentType TEXT DEFAULT 'monthly' CHECK (paymentType IN ('monthly', 'annually', 'one_time')),
      amount REAL DEFAULT 0,
      lastPaymentDate TEXT,
      nomineeName TEXT,
      nomineeRelation TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
    CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(firstName, lastName);
    CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
    CREATE INDEX IF NOT EXISTS idx_shops_name ON shops(shopName);
    CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
    CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(accountNumber);
    CREATE INDEX IF NOT EXISTS idx_accounts_institution ON accounts(institutionType, institutionName);
  `);

  console.log('Database initialized successfully!');
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