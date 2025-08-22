import { getDatabase } from './database';

export function cleanupDatabase() {
  console.log('Cleaning up database...');
  
  const db = getDatabase();
  
  try {
    // Start transaction
    db.exec('BEGIN TRANSACTION');
    
    // Delete all data from tables (in correct order due to foreign keys)
    db.exec('DELETE FROM shop_clients');
    db.exec('DELETE FROM accounts');
    db.exec('DELETE FROM shops');
    db.exec('DELETE FROM clients');
    
    // Reset auto-increment counters
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('clients', 'shops', 'accounts', 'shop_clients')");
    
    // Commit transaction
    db.exec('COMMIT');
    
    console.log('✅ Database cleanup completed successfully!');
    console.log('All test data has been removed.');
    
    // Verify cleanup
    const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
    const shopCount = db.prepare('SELECT COUNT(*) as count FROM shops').get() as { count: number };
    const accountCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number };
    const shopClientCount = db.prepare('SELECT COUNT(*) as count FROM shop_clients').get() as { count: number };
    
    console.log(`Clients: ${clientCount.count}`);
    console.log(`Shops: ${shopCount.count}`);
    console.log(`Accounts: ${accountCount.count}`);
    console.log(`Shop-Client relationships: ${shopClientCount.count}`);
    
    return {
      success: true,
      message: 'Database cleaned successfully',
      counts: {
        clients: clientCount.count,
        shops: shopCount.count,
        accounts: accountCount.count,
        shopClients: shopClientCount.count
      }
    };
    
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    console.error('❌ Database cleanup failed:', error);
    throw error;
  }
}
