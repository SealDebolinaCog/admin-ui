"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountRepository = void 0;
const database_1 = require("./database");
class AccountRepository {
    constructor() {
        this.db = (0, database_1.getDatabase)();
    }
    // Get all accounts with optional filtering
    getAll(filters) {
        let query = `
      SELECT * FROM accounts 
      WHERE 1=1
    `;
        const params = [];
        if (filters?.status) {
            query += ` AND status = ?`;
            params.push(filters.status);
        }
        if (filters?.search) {
            query += ` AND (accountNumber LIKE ? OR accountHolderNames LIKE ? OR institutionName LIKE ?)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        if (filters?.institutionType) {
            query += ` AND institutionType = ?`;
            params.push(filters.institutionType);
        }
        if (filters?.accountType) {
            query += ` AND accountType = ?`;
            params.push(filters.accountType);
        }
        if (filters?.paymentType) {
            query += ` AND paymentType = ?`;
            params.push(filters.paymentType);
        }
        if (filters?.tenureRange) {
            // Parse tenure range (e.g., "0-12", "12-24", "24+")
            const [min, max] = filters.tenureRange.split('-').map(Number);
            if (max) {
                query += ` AND tenure BETWEEN ? AND ?`;
                params.push(min, max);
            }
            else {
                query += ` AND tenure >= ?`;
                params.push(min);
            }
        }
        query += ` ORDER BY accountHolderNames, accountNumber`;
        const stmt = this.db.prepare(query);
        const results = stmt.all(params);
        // Parse JSON strings back to arrays
        return results.map(account => ({
            ...account,
            accountHolderNames: JSON.parse(account.accountHolderNames || '[]')
        }));
    }
    // Get account by ID
    getById(id) {
        const stmt = this.db.prepare('SELECT * FROM accounts WHERE id = ?');
        const result = stmt.get(id);
        if (!result)
            return undefined;
        return {
            ...result,
            accountHolderNames: JSON.parse(result.accountHolderNames || '[]')
        };
    }
    // Get account by account number
    getByAccountNumber(accountNumber) {
        const stmt = this.db.prepare('SELECT * FROM accounts WHERE accountNumber = ?');
        const result = stmt.get(accountNumber);
        if (!result)
            return undefined;
        return {
            ...result,
            accountHolderNames: JSON.parse(result.accountHolderNames || '[]')
        };
    }
    // Create new account
    create(account) {
        const stmt = this.db.prepare(`
      INSERT INTO accounts (
        accountNumber, accountOwnershipType, accountHolderNames, institutionType,
        accountType, institutionName, branchCode, ifscCode, tenure, status,
        startDate, maturityDate, paymentType, amount, lastPaymentDate,
        nomineeName, nomineeRelation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(account.accountNumber, account.accountOwnershipType, JSON.stringify(account.accountHolderNames), account.institutionType, account.accountType, account.institutionName, account.branchCode || null, account.ifscCode || null, account.tenure, account.status, account.startDate || null, account.maturityDate || null, account.paymentType, account.amount, account.lastPaymentDate || null, account.nomineeName || null, account.nomineeRelation || null);
        return { ...account, id: result.lastInsertRowid };
    }
    // Update existing account
    update(id, account) {
        const fields = [];
        const values = [];
        Object.entries(account).forEach(([key, value]) => {
            if (value !== undefined) {
                if (key === 'accountHolderNames') {
                    fields.push(`${key} = ?`);
                    values.push(JSON.stringify(value));
                }
                else {
                    fields.push(`${key} = ?`);
                    values.push(value);
                }
            }
        });
        if (fields.length === 0)
            return false;
        fields.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);
        const query = `UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`;
        const stmt = this.db.prepare(query);
        const result = stmt.run(...values);
        return result.changes > 0;
    }
    // Delete account
    delete(id) {
        const stmt = this.db.prepare('DELETE FROM accounts WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // Get accounts count
    getCount() {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM accounts');
        const result = stmt.get();
        return result.count;
    }
    // Get accounts by status
    getByStatus(status) {
        const stmt = this.db.prepare('SELECT * FROM accounts WHERE status = ? ORDER BY accountHolderNames, accountNumber');
        const results = stmt.all(status);
        return results.map(account => ({
            ...account,
            accountHolderNames: JSON.parse(account.accountHolderNames || '[]')
        }));
    }
    // Search accounts
    search(searchTerm) {
        const stmt = this.db.prepare(`
      SELECT * FROM accounts 
      WHERE accountNumber LIKE ? OR accountHolderNames LIKE ? OR institutionName LIKE ?
      ORDER BY accountHolderNames, accountNumber
    `);
        const term = `%${searchTerm}%`;
        const results = stmt.all(term, term, term);
        return results.map(account => ({
            ...account,
            accountHolderNames: JSON.parse(account.accountHolderNames || '[]')
        }));
    }
    // Get accounts by institution type
    getByInstitutionType(institutionType) {
        const stmt = this.db.prepare('SELECT * FROM accounts WHERE institutionType = ? ORDER BY accountHolderNames, accountNumber');
        const results = stmt.all(institutionType);
        return results.map(account => ({
            ...account,
            accountHolderNames: JSON.parse(account.accountHolderNames || '[]')
        }));
    }
    // Get accounts by account type
    getByAccountType(accountType) {
        const stmt = this.db.prepare('SELECT * FROM accounts WHERE accountType = ? ORDER BY accountHolderNames, accountNumber');
        const results = stmt.all(accountType);
        return results.map(account => ({
            ...account,
            accountHolderNames: JSON.parse(account.accountHolderNames || '[]')
        }));
    }
    // Get accounts by payment type
    getByPaymentType(paymentType) {
        const stmt = this.db.prepare('SELECT * FROM accounts WHERE paymentType = ? ORDER BY accountHolderNames, accountNumber');
        const results = stmt.all(paymentType);
        return results.map(account => ({
            ...account,
            accountHolderNames: JSON.parse(account.accountHolderNames || '[]')
        }));
    }
}
exports.AccountRepository = AccountRepository;
//# sourceMappingURL=accounts.js.map