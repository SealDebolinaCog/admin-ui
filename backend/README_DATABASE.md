# SQLite Database Setup for Admin UI Backend

This document describes the SQLite database implementation for the Admin UI backend, including setup, enhanced schema, and usage.

## 🗄️ Database Overview

The application uses **SQLite** with the `better-sqlite3` library for comprehensive data management:
- **👤 Clients Management**: Personal information, KYC documents, profile pictures
- **🏪 Shops Management**: Business entities, outlet images, client relationships
- **💳 Accounts Management**: Financial accounts, institutions, transaction history
- **📄 Documents Management**: KYC compliance, account documents, verification workflow
- **📸 Media Management**: Profile pictures, shop images, account photos
- **💰 Transaction Tracking**: Complete financial history with audit trails
- **📋 Audit Logging**: System-wide change tracking for compliance

## 📁 File Structure

```
backend/src/database/
├── database.ts          # Main database configuration and enhanced schema
├── addresses.ts         # Address repository (normalized)
├── institutions.ts      # Institution repository (banks, post offices)
├── clients.ts           # Client repository with enhanced features
├── shops.ts            # Shop repository and data access layer
├── accounts.ts         # Account repository with institution links
├── accountHolders.ts   # Account ownership management
├── transactions.ts     # Transaction history and balance tracking
├── documents.ts        # Document management (KYC, account docs)
├── profilePictures.ts  # Image management for all entities
├── auditLog.ts         # System-wide audit trail
├── mockData.ts         # Sample data setup (optional)
└── index.ts            # Exports all repositories and types
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install sqlite3 better-sqlite3 @types/better-sqlite3
```

### 2. Database Initialization
The database is automatically initialized when the server starts:
- **Enhanced schema** with 11 normalized tables is created
- **Foreign key relationships** are established
- **Performance indexes** are created for all tables
- **Clean database** with no mock data (production-ready)

### 3. Start the Server
```bash
npm run dev
```

## 🏗️ Enhanced Database Schema

The database uses a **normalized, relational design** with 11 interconnected tables:

### 🏠 Core Infrastructure Tables

#### ADDRESSES - Normalized Address Storage
```sql
CREATE TABLE addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  addressLine1 TEXT NOT NULL,
  addressLine2 TEXT,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  pincode TEXT NOT NULL,
  country TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### INSTITUTIONS - Banks & Post Offices
```sql
CREATE TABLE institutions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institutionType TEXT NOT NULL CHECK (institutionType IN ('bank', 'post_office')),
  institutionName TEXT NOT NULL,
  branchCode TEXT,
  ifscCode TEXT,
  pinCode TEXT,
  addressId INTEGER REFERENCES addresses(id),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 👤 Entity Tables

#### CLIENTS - Enhanced Client Management
```sql
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT UNIQUE,
  phoneNumber TEXT,
  dateOfBirth DATE,
  gender TEXT,
  occupation TEXT,
  addressId INTEGER REFERENCES addresses(id),
  linkedClientId INTEGER REFERENCES clients(id),
  deletionStatus TEXT DEFAULT 'active' CHECK (deletionStatus IN ('active', 'soft_deleted', 'hard_deleted')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### SHOPS - Business Entity Management
```sql
CREATE TABLE shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shopName TEXT NOT NULL,
  shopType TEXT,
  licenseNumber TEXT,
  ownerId INTEGER REFERENCES clients(id),
  addressId INTEGER REFERENCES addresses(id),
  deletionStatus TEXT DEFAULT 'active' CHECK (deletionStatus IN ('active', 'soft_deleted', 'hard_deleted')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### ACCOUNTS - Financial Account Management
```sql
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accountNumber TEXT UNIQUE NOT NULL,
  accountType TEXT NOT NULL CHECK (accountType IN ('savings', 'current', 'fixed_deposit', 'recurring_deposit', 'loan')),
  accountOwnershipType TEXT NOT NULL CHECK (accountOwnershipType IN ('individual', 'joint', 'minor')),
  balance DECIMAL DEFAULT 0.00,
  interestRate DECIMAL,
  maturityDate DATE,
  institutionId INTEGER REFERENCES institutions(id),
  deletionStatus TEXT DEFAULT 'active' CHECK (deletionStatus IN ('active', 'soft_deleted', 'hard_deleted')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 🔗 Relationship Tables

#### ACCOUNT_HOLDERS - Many-to-Many Client-Account Relationships
```sql
CREATE TABLE account_holders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accountId INTEGER REFERENCES accounts(id),
  clientId INTEGER REFERENCES clients(id),
  holderType TEXT NOT NULL CHECK (holderType IN ('primary', 'secondary', 'nominee')),
  sharePercentage DECIMAL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(accountId, clientId)
);
```

#### SHOP_CLIENTS - Shop-Client Business Relationships
```sql
CREATE TABLE shop_clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shopId INTEGER REFERENCES shops(id),
  clientId INTEGER REFERENCES clients(id),
  relationshipType TEXT NOT NULL CHECK (relationshipType IN ('customer', 'supplier', 'partner')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shopId, clientId)
);
```

### 💰 Transaction & Audit Tables

#### TRANSACTIONS - Complete Financial History
```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accountId INTEGER REFERENCES accounts(id),
  transactionType TEXT NOT NULL CHECK (transactionType IN ('deposit', 'withdrawal', 'transfer', 'interest', 'fee')),
  amount DECIMAL NOT NULL,
  balanceAfter DECIMAL NOT NULL,
  description TEXT,
  referenceNumber TEXT,
  transactionDate DATE NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'cancelled')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### AUDIT_LOG - System-Wide Change Tracking
```sql
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tableName TEXT NOT NULL,
  recordId INTEGER NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'RESTORE')),
  oldValues TEXT, -- JSON string
  newValues TEXT, -- JSON string
  userId TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 📄 Document & Media Tables

#### DOCUMENTS - KYC & Account Document Management
```sql
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
);
```

#### PROFILE_PICTURES - Entity Image Management
```sql
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
  UNIQUE(entityType, entityId, imageType, isActive)
);
```

## 🔍 API Endpoints

### Clients
- `GET /api/clients` - Get all clients with filtering
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/stats/count` - Get client count
- `GET /api/clients/status/:status` - Get clients by status

### Shops
- `GET /api/shops` - Get all shops with filtering
- `GET /api/shops/:id` - Get shop by ID
- `POST /api/shops` - Create new shop
- `PUT /api/shops/:id` - Update shop
- `DELETE /api/shops/:id` - Delete shop
- `GET /api/shops/stats/count` - Get shop count
- `GET /api/shops/status/:status` - Get shops by status
- `GET /api/shops/type/:shopType` - Get shops by type
- `GET /api/shops/category/:category` - Get shops by category

### Accounts
- `GET /api/accounts` - Get all accounts with filtering
- `GET /api/accounts/:id` - Get account by ID
- `GET /api/accounts/number/:accountNumber` - Get account by number
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/stats/count` - Get account count
- `GET /api/accounts/status/:status` - Get accounts by status
- `GET /api/accounts/institution/:institutionType` - Get accounts by institution
- `GET /api/accounts/type/:accountType` - Get accounts by type
- `GET /api/accounts/payment/:paymentType` - Get accounts by payment type

## 🛠️ Database Utilities

### DatabaseUtils Class
```typescript
import { DatabaseUtils } from './database/utils';

const dbUtils = new DatabaseUtils();

// Get statistics
const stats = dbUtils.getStats();

// Clear all data (for testing)
dbUtils.clearAllData();

// Export data to JSON
const data = dbUtils.exportData();

// Check database integrity
const isHealthy = dbUtils.checkIntegrity();

// Optimize database
dbUtils.optimize();
```

## 📊 Database State

The database initializes with a **clean, production-ready state**:

### Current Configuration
- **No mock data** - Database starts empty for real data entry
- **Enhanced schema** - All 11 tables with proper relationships
- **Performance optimized** - Comprehensive indexing strategy
- **Audit ready** - Complete change tracking enabled

### Optional Mock Data
Mock data setup is available in `mockData.ts` but not automatically loaded:
- Sample clients with KYC documents and profile pictures
- Sample shops with outlet images and client relationships  
- Sample accounts with transaction history and document management
- Complete audit trail and verification workflows

To enable mock data for testing:
```typescript
import { setupMockData, testDatabaseOperations } from './database/mockData';
await setupMockData();
await testDatabaseOperations();
```

## 🔧 Configuration

### Database File Location
The database file is created at: `backend/data/admin_ui.db`

### Environment Variables
```bash
# Optional: Custom database path
DB_PATH=/path/to/custom/database.db

# Optional: Database timeout
DB_TIMEOUT=5000
```

## 📈 Performance Features

### Comprehensive Indexing Strategy
- **ADDRESSES**: Pincode, state/district composite indexes
- **INSTITUTIONS**: Type, IFSC code, address indexes  
- **CLIENTS**: Email, phone, address, linked client, deletion status indexes
- **SHOPS**: Owner, address, license, deletion status indexes
- **ACCOUNTS**: Number, type, institution, deletion status indexes
- **ACCOUNT_HOLDERS**: Account, client composite indexes with unique constraints
- **SHOP_CLIENTS**: Shop, client composite indexes with unique constraints
- **TRANSACTIONS**: Account, date, type, status indexes for fast queries
- **DOCUMENTS**: Entity, type, number, verification, expiry indexes
- **PROFILE_PICTURES**: Entity, type, active status indexes
- **AUDIT_LOG**: Table/record composite, timestamp, operation indexes

### Database Optimization
- **Foreign key constraints** enabled for referential integrity
- **WAL mode** enabled for better concurrent access
- **Prepared statements** for all queries (security + performance)
- **Unique constraints** prevent duplicate critical data
- **Check constraints** validate enum values and data ranges

## 🧪 Testing

### Development Mode
```bash
npm run dev
```
- Database is automatically initialized with clean schema
- No automatic data seeding (production-ready)
- Hot reloading enabled

### Production Mode
```bash
npm run build
npm start
```
- Database is initialized on startup
- Clean state maintained (data persists between restarts)

## 🚨 Error Handling

### Database Errors
- Connection errors are logged and handled gracefully
- Query errors return appropriate HTTP status codes
- Validation errors provide detailed feedback

### Data Validation
- Required fields are enforced at database level
- Status values are restricted to predefined options
- Unique constraints prevent duplicate data

## 🔒 Security Features

- SQL injection prevention through prepared statements
- Input validation and sanitization
- CORS configuration for frontend access
- Helmet.js for security headers

## 📝 Logging

Database operations are logged for:
- Initialization and seeding
- CRUD operations
- Error conditions
- Performance metrics

## 🚀 Deployment

### Docker
The database file is included in the Docker image and persists in the container.

### Local Development
Database file is created in the `backend/data/` directory.

### Backup
Use the `DatabaseUtils.backup()` method to create database backups.

## 📚 Additional Resources

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/) 