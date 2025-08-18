"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseUtils = void 0;
const database_1 = require("./database");
const index_1 = require("./index");
class DatabaseUtils {
    constructor() {
        this.db = (0, database_1.getDatabase)();
    }
    // Get database statistics
    getStats() {
        const clientRepo = new index_1.ClientRepository();
        const shopRepo = new index_1.ShopRepository();
        const accountRepo = new index_1.AccountRepository();
        return {
            clients: {
                total: clientRepo.getCount(),
                byStatus: {
                    active: clientRepo.getByStatus('active').length,
                    suspended: clientRepo.getByStatus('suspended').length,
                    closed: clientRepo.getByStatus('closed').length
                }
            },
            shops: {
                total: shopRepo.getCount(),
                byStatus: {
                    active: shopRepo.getByStatus('active').length,
                    suspended: shopRepo.getByStatus('suspended').length
                }
            },
            accounts: {
                total: accountRepo.getCount(),
                byStatus: {
                    active: accountRepo.getByStatus('active').length,
                    suspended: accountRepo.getByStatus('suspended').length,
                    fined: accountRepo.getByStatus('fined').length,
                    matured: accountRepo.getByStatus('matured').length,
                    closed: accountRepo.getByStatus('closed').length
                },
                byInstitution: {
                    bank: accountRepo.getByInstitutionType('bank').length,
                    post_office: accountRepo.getByInstitutionType('post_office').length
                }
            }
        };
    }
    // Clear all data (for testing)
    clearAllData() {
        console.log('Clearing all data...');
        try {
            this.db.exec(`
        DELETE FROM accounts;
        DELETE FROM shops;
        DELETE FROM clients;
      `);
            // Reset auto-increment counters
            this.db.exec(`
        DELETE FROM sqlite_sequence WHERE name IN ('clients', 'shops', 'accounts');
      `);
            console.log('All data cleared successfully');
            return true;
        }
        catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
    // Export data to JSON
    exportData() {
        const clientRepo = new index_1.ClientRepository();
        const shopRepo = new index_1.ShopRepository();
        const accountRepo = new index_1.AccountRepository();
        return {
            clients: clientRepo.getAll(),
            shops: shopRepo.getAll(),
            accounts: accountRepo.getAll(),
            exportedAt: new Date().toISOString()
        };
    }
    // Get database file info
    getDatabaseInfo() {
        const dbPath = this.db.name;
        const stats = this.db.pragma('table_info', { simple: true });
        return {
            path: dbPath,
            tables: stats.map((table) => table.name),
            size: this.db.pragma('page_count')[0].page_count * this.db.pragma('page_size')[0].page_size
        };
    }
    // Backup database
    backup(backupPath) {
        try {
            this.db.backup(backupPath);
            console.log(`Database backed up to: ${backupPath}`);
            return true;
        }
        catch (error) {
            console.error('Backup failed:', error);
            return false;
        }
    }
    // Check database integrity
    checkIntegrity() {
        try {
            const result = this.db.pragma('integrity_check');
            return result[0].integrity_check === 'ok';
        }
        catch (error) {
            console.error('Integrity check failed:', error);
            return false;
        }
    }
    // Optimize database
    optimize() {
        try {
            this.db.pragma('optimize');
            console.log('Database optimized successfully');
            return true;
        }
        catch (error) {
            console.error('Optimization failed:', error);
            return false;
        }
    }
}
exports.DatabaseUtils = DatabaseUtils;
//# sourceMappingURL=utils.js.map