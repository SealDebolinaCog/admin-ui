# Database Utility Scripts

## Delete Records Script

A utility script to delete records from the database tables.

### Usage

#### Delete from a specific table:
```bash
# Using npm script
npm run delete-records clients
npm run delete-records addresses
npm run delete-records contacts

# Or directly
node scripts/delete-records.js clients
```

#### Delete from all tables:
```bash
# Using npm script
npm run clear-db

# Or directly  
node scripts/delete-records.js
```

### Available Tables
- `clients` - Client records
- `addresses` - Address records
- `contacts` - Contact information
- `documents` - Document records
- `shops` - Shop records
- `accounts` - Account records
- `audit_log` - Audit trail records

### Features
- ✅ Interactive confirmation prompts
- ✅ Shows record counts before deletion
- ✅ Resets auto-increment counters
- ✅ Handles foreign key constraints (deletes in proper order)
- ✅ Error handling and validation
- ✅ Safe execution with multiple confirmations

### Examples

```bash
# Delete all client records
npm run delete-records clients

# Clear entire database
npm run clear-db

# Direct script execution
./scripts/delete-records.js contacts
```

### Safety Features
- Requires explicit "yes" confirmation
- Shows exact number of records to be deleted
- Validates table names
- Handles non-existent tables gracefully
- Provides clear success/error messages
