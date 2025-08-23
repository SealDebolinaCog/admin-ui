import { getDatabase } from './database';
import { Account } from './types';

export { Account };

export class AccountRepository {
  private db = getDatabase();

  // Get all accounts with optional filtering
  getAll(filters?: {
    accountType?: string;
    search?: string;
    institutionId?: number;
    includeDeleted?: boolean;
  }): Account[] {
    let query = `
      SELECT a.*, i.institutionName, i.institutionType 
      FROM accounts a
      LEFT JOIN institutions i ON a.institutionId = i.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Only show active records by default
    if (!filters?.includeDeleted) {
      query += ` AND a.deletionStatus = 'active'`;
    }

    if (filters?.accountType) {
      query += ` AND a.accountType = ?`;
      params.push(filters.accountType);
    }

    if (filters?.search) {
      query += ` AND (a.accountNumber LIKE ? OR i.institutionName LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters?.institutionId) {
      query += ` AND a.institutionId = ?`;
      params.push(filters.institutionId);
    }

    query += ` ORDER BY a.accountNumber`;

    const stmt = this.db.prepare(query);
    return stmt.all(params) as Account[];
  }

  // Get account by ID
  getById(id: number): Account | undefined {
    const stmt = this.db.prepare(`
      SELECT a.*, i.institutionName, i.institutionType 
      FROM accounts a
      LEFT JOIN institutions i ON a.institutionId = i.id
      WHERE a.id = ? AND a.deletionStatus = 'active'
    `);
    return stmt.get(id) as Account | undefined;
  }

  // Get account by account number
  getByAccountNumber(accountNumber: string): Account | undefined {
    const stmt = this.db.prepare(`
      SELECT a.*, i.institutionName, i.institutionType 
      FROM accounts a
      LEFT JOIN institutions i ON a.institutionId = i.id
      WHERE a.accountNumber = ? AND a.deletionStatus = 'active'
    `);
    return stmt.get(accountNumber) as Account | undefined;
  }

  // Create new account
  create(account: any): Account {
    const stmt = this.db.prepare(`
      INSERT INTO accounts (
        accountNumber, accountType, accountOwnershipType, balance, 
        interestRate, maturityDate, institutionId, deletionStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = stmt.run(
      account.accountNumber,
      account.accountType,
      account.accountOwnershipType,
      account.balance || 0,
      account.interestRate || null,
      account.maturityDate || null,
      account.institutionId
    );

    return { 
      ...account, 
      id: result.lastInsertRowid as number, 
      deletionStatus: 'active' 
    };
  }

  // Update existing account
  update(id: number, account: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(account).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    const result = stmt.run(...values);

    return result.changes > 0;
  }

  // Soft delete account
  delete(id: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE accounts 
      SET deletionStatus = 'soft_deleted', updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Hard delete account (permanently remove from database)
  hardDelete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM accounts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Restore deleted account
  restore(id: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE accounts 
      SET deletionStatus = 'active', updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Get accounts count (excluding deleted by default)
  getCount(includeDeleted: boolean = false): number {
    let query = 'SELECT COUNT(*) as count FROM accounts';
    if (!includeDeleted) {
      query += ` WHERE deletionStatus = 'active'`;
    }
    const stmt = this.db.prepare(query);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  // Get accounts by account type
  getByAccountType(accountType: string, includeDeleted: boolean = false): Account[] {
    let query = `
      SELECT a.*, i.institutionName, i.institutionType 
      FROM accounts a
      LEFT JOIN institutions i ON a.institutionId = i.id
      WHERE a.accountType = ?
    `;
    if (!includeDeleted) {
      query += ` AND a.deletionStatus = 'active'`;
    }
    query += ` ORDER BY a.accountNumber`;
    const stmt = this.db.prepare(query);
    return stmt.all(accountType) as Account[];
  }

  // Search accounts
  search(searchTerm: string, includeDeleted: boolean = false): Account[] {
    let query = `
      SELECT a.*, i.institutionName, i.institutionType 
      FROM accounts a
      LEFT JOIN institutions i ON a.institutionId = i.id
      WHERE (a.accountNumber LIKE ? OR i.institutionName LIKE ?)
    `;
    if (!includeDeleted) {
      query += ` AND a.deletionStatus = 'active'`;
    }
    query += ` ORDER BY a.accountNumber`;
    const stmt = this.db.prepare(query);
    const term = `%${searchTerm}%`;
    return stmt.all(term, term) as Account[];
  }

  // Get accounts by status
  getByStatus(status: string): Account[] {
    const query = `
      SELECT 
        a.*,
        i.name as institutionName,
        i.type as institutionType,
        i.ifscCode,
        i.branchName
      FROM accounts a
      LEFT JOIN institutions i ON a.institutionId = i.id
      WHERE a.status = ? AND a.deletionStatus = 'active'
      ORDER BY a.accountNumber
    `;
    const stmt = this.db.prepare(query);
    return stmt.all(status) as Account[];
  }

  // Get accounts by institution type
  getByInstitutionType(institutionType: string): Account[] {
    const query = `
      SELECT 
        a.*,
        i.name as institutionName,
        i.type as institutionType,
        i.ifscCode,
        i.branchName
      FROM accounts a
      LEFT JOIN institutions i ON a.institutionId = i.id
      WHERE i.type = ? AND a.deletionStatus = 'active'
      ORDER BY a.accountNumber
    `;
    const stmt = this.db.prepare(query);
    return stmt.all(institutionType) as Account[];
  }

  // Get accounts by payment type
  getByPaymentType(paymentType: string): Account[] {
    const query = `
      SELECT 
        a.*,
        i.name as institutionName,
        i.type as institutionType,
        i.ifscCode,
        i.branchName
      FROM accounts a
      LEFT JOIN institutions i ON a.institutionId = i.id
      WHERE a.paymentType = ? AND a.deletionStatus = 'active'
      ORDER BY a.accountNumber
    `;
    const stmt = this.db.prepare(query);
    return stmt.all(paymentType) as Account[];
  }
} 