"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
// Database file path
const DB_PATH = path_1.default.join(__dirname, '../../data/admin_ui.db');
// Create database instance
const db = new better_sqlite3_1.default(DB_PATH);
// Enable foreign keys
db.pragma('foreign_keys = ON');
// Initialize database tables
function initializeDatabase() {
    console.log('Initializing database...');
    // Create clients table
    db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      addressLine1 TEXT,
      addressLine2 TEXT,
      addressLine3 TEXT,
      state TEXT,
      district TEXT,
      pincode TEXT,
      country TEXT DEFAULT 'India',
      nomineeName TEXT,
      nomineeRelation TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Create shops table
    db.exec(`
    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shopName TEXT NOT NULL,
      shopType TEXT,
      category TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
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
function getDatabase() {
    return db;
}
// Close database connection
function closeDatabase() {
    db.close();
}
// Initialize database when this module is imported
initializeDatabase();
//# sourceMappingURL=database.js.map