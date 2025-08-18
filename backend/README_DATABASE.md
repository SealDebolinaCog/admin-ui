# SQLite Database Setup for Admin UI Backend

This document describes the SQLite database implementation for the Admin UI backend, including setup, schema, and usage.

## 🗄️ Database Overview

The application uses **SQLite** with the `better-sqlite3` library for:
- **Clients Management**: Personal information, addresses, nominees
- **Shops Management**: Business information, owners, locations
- **Accounts Management**: Financial accounts, institutions, payment details

## 📁 File Structure

```
backend/src/database/
├── database.ts          # Main database configuration and initialization
├── clients.ts           # Client repository and data access layer
├── shops.ts            # Shop repository and data access layer
├── accounts.ts         # Account repository and data access layer
├── index.ts            # Exports all repositories and types
├── seed.ts             # Initial data seeding
└── utils.ts            # Database utility functions
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install sqlite3 better-sqlite3 @types/better-sqlite3
```

### 2. Database Initialization
The database is automatically initialized when the server starts:
- Tables are created if they don't exist
- Initial sample data is seeded
- Indexes are created for performance

### 3. Start the Server
```bash
npm run dev
```

## 🏗️ Database Schema

### Clients Table
```sql
CREATE TABLE clients (
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
);
```

### Shops Table
```sql
CREATE TABLE shops (
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
);
```

### Accounts Table
```sql
CREATE TABLE accounts (
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

## 📊 Data Seeding

The database is automatically seeded with sample data on first run:

### Sample Clients
- John Doe (Active)
- Alice Johnson (Active)
- Michael Brown (Suspended)

### Sample Shops
- Tech Solutions Ltd (Technology, Active)
- Green Grocers (Retail, Active)
- Fashion Forward (Retail, Suspended)

### Sample Accounts
- ACC001: Joint Bank Account (Active)
- ACC002: Single Post Office RD (Active)
- ACC003: Joint Post Office TD (Matured)

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

### Indexes
- Client status and name indexes
- Shop status and name indexes
- Account status, number, and institution indexes

### Prepared Statements
All database queries use prepared statements for:
- Security (SQL injection prevention)
- Performance (query plan caching)
- Memory efficiency

## 🧪 Testing

### Development Mode
```bash
npm run dev
```
- Database is automatically initialized
- Sample data is seeded
- Hot reloading enabled

### Production Mode
```bash
npm run build
npm start
```
- Database is initialized on startup
- No automatic seeding (data persists)

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