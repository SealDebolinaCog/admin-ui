#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');
const readline = require('readline');

// Database connection
const DB_PATH = path.join(__dirname, '../data/admin_ui.db');

// List of all tables in the database
const ALL_TABLES = [
  'clients',
  'addresses', 
  'contacts',
  'documents',
  'shops',
  'accounts',
  'audit_log'
];

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function deleteRecords(tableName = null) {
  let db;
  
  try {
    // Check if database file exists
    const fs = require('fs');
    if (!fs.existsSync(DB_PATH)) {
      console.error('❌ Database file not found:', DB_PATH);
      process.exit(1);
    }

    db = new Database(DB_PATH);
    
    if (tableName) {
      // Delete from specific table
      await deleteFromTable(db, tableName);
    } else {
      // Delete from all tables
      await deleteFromAllTables(db);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (db) {
      db.close();
    }
    rl.close();
  }
}

async function deleteFromTable(db, tableName) {
  // Check if table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name=?
  `).get(tableName);
  
  if (!tableExists) {
    console.error(`❌ Table '${tableName}' does not exist`);
    console.log('Available tables:', ALL_TABLES.join(', '));
    return;
  }
  
  // Get current record count
  const countResult = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
  const recordCount = countResult.count;
  
  if (recordCount === 0) {
    console.log(`ℹ️  Table '${tableName}' is already empty`);
    return;
  }
  
  console.log(`⚠️  About to delete ${recordCount} records from table '${tableName}'`);
  const confirm = await askQuestion('Are you sure? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Operation cancelled');
    return;
  }
  
  // Delete records
  const deleteStmt = db.prepare(`DELETE FROM ${tableName}`);
  const result = deleteStmt.run();
  
  console.log(`✅ Successfully deleted ${result.changes} records from '${tableName}'`);
  
  // Reset auto-increment counter if table has an id column
  try {
    db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(tableName);
    console.log(`🔄 Reset auto-increment counter for '${tableName}'`);
  } catch (e) {
    // Table might not have auto-increment, ignore error
  }
}

async function deleteFromAllTables(db) {
  console.log('⚠️  About to delete ALL records from ALL tables:');
  console.log(ALL_TABLES.map(table => `  - ${table}`).join('\n'));
  
  // Get total record counts
  let totalRecords = 0;
  const tableCounts = {};
  
  for (const table of ALL_TABLES) {
    try {
      const countResult = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      tableCounts[table] = countResult.count;
      totalRecords += countResult.count;
    } catch (e) {
      // Table might not exist, skip
      tableCounts[table] = 0;
    }
  }
  
  if (totalRecords === 0) {
    console.log('ℹ️  All tables are already empty');
    return;
  }
  
  console.log(`\nTotal records to delete: ${totalRecords}`);
  Object.entries(tableCounts).forEach(([table, count]) => {
    if (count > 0) {
      console.log(`  - ${table}: ${count} records`);
    }
  });
  
  const confirm = await askQuestion('\nThis will delete ALL data! Are you absolutely sure? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Operation cancelled');
    return;
  }
  
  // Delete from all tables
  let totalDeleted = 0;
  
  // Delete in reverse order to handle foreign key constraints
  const reversedTables = [...ALL_TABLES].reverse();
  
  for (const table of reversedTables) {
    try {
      const deleteStmt = db.prepare(`DELETE FROM ${table}`);
      const result = deleteStmt.run();
      
      if (result.changes > 0) {
        console.log(`✅ Deleted ${result.changes} records from '${table}'`);
        totalDeleted += result.changes;
      }
      
      // Reset auto-increment counter
      try {
        db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
      } catch (e) {
        // Ignore if table doesn't have auto-increment
      }
    } catch (error) {
      console.log(`⚠️  Could not delete from '${table}': ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Successfully deleted ${totalDeleted} total records from all tables`);
  console.log('🔄 Reset all auto-increment counters');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const tableName = args[0];
  
  console.log('🗑️  Database Record Deletion Utility\n');
  
  if (tableName) {
    console.log(`Target: Table '${tableName}'`);
  } else {
    console.log('Target: ALL TABLES');
  }
  
  console.log(`Database: ${DB_PATH}\n`);
  
  await deleteRecords(tableName);
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { deleteRecords };
