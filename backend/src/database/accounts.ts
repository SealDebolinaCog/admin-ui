import { getDatabase } from './database';

export interface Account {
  id?: number;
  accountNumber: string;
  accountOwnershipType: 'single' | 'joint';
  accountHolderNames: string[]; // Will be stored as JSON string in DB
  institutionType: 'bank' | 'post_office';
  accountType: string;
  institutionName: string;
  branchCode?: string;
  ifscCode?: string;
  tenure: number; // in months
  status: 'active' | 'suspended' | 'fined' | 'matured' | 'closed';
  startDate?: string;
  maturityDate?: string;
  paymentType: 'monthly' | 'annually' | 'one_time';
  amount: number;
  lastPaymentDate?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  deletionStatus?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class AccountRepository {
  private db = getDatabase();

  // Get all accounts with optional filtering
  getAll(filters?: {
    status?: string;
    search?: string;
    institutionType?: string;
    accountType?: string;
    paymentType?: string;
    tenureRange?: string;
    clientIds?: number[];
    includeDeleted?: boolean;
  }): Account[] {
    let query = `
      SELECT * FROM accounts 
      WHERE 1=1
    `;
    const params: any[] = [];

    // Only show non-deleted records by default
    if (!filters?.includeDeleted) {
      query += ` AND deletionStatus = 0`;
    }

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
      } else {
        query += ` AND tenure >= ?`;
        params.push(min);
      }
    }

    if (filters?.clientIds && filters.clientIds.length > 0) {
      // Filter accounts by client IDs - check if any client ID appears in accountHolderNames JSON
      const placeholders = filters.clientIds.map(() => '?').join(',');
      query += ` AND (`;
      filters.clientIds.forEach((clientId, index) => {
        if (index > 0) query += ' OR ';
        query += `accountHolderNames LIKE ?`;
        params.push(`%"${clientId}"%`);
      });
      query += ')';
    }

    query += ` ORDER BY accountHolderNames, accountNumber`;

    const stmt = this.db.prepare(query);
    const results = stmt.all(params) as any[];
    
    // Parse JSON strings back to arrays
    return results.map(account => ({
      ...account,
      accountHolderNames: JSON.parse(account.accountHolderNames || '[]')
    }));
  }

  // Get account by ID
  getById(id: number): Account | undefined {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE id = ? AND deletionStatus = 0');
    const result = stmt.get(id) as any;
    
    if (!result) return undefined;
    
    return {
      ...result,
      accountHolderNames: JSON.parse(result.accountHolderNames || '[]')
    };
  }

  // Get account by account number
  getByAccountNumber(accountNumber: string): Account | undefined {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE accountNumber = ? AND deletionStatus = 0');
    const result = stmt.get(accountNumber) as any;
    
    if (!result) return undefined;
    
    return {
      ...result,
      accountHolderNames: JSON.parse(result.accountHolderNames || '[]')
    };
  }

  // Create new account
  create(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'deletionStatus'>): Account {
    const stmt = this.db.prepare(`
      INSERT INTO accounts (
        accountNumber, accountOwnershipType, accountHolderNames, institutionType,
        accountType, institutionName, branchCode, ifscCode, tenure, status,
        startDate, maturityDate, paymentType, amount, lastPaymentDate,
        nomineeName, nomineeRelation, deletionStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    const result = stmt.run(
      account.accountNumber,
      account.accountOwnershipType,
      JSON.stringify(account.accountHolderNames),
      account.institutionType,
      account.accountType,
      account.institutionName,
      account.branchCode || null,
      account.ifscCode || null,
      account.tenure,
      account.status,
      account.startDate || null,
      account.maturityDate || null,
      account.paymentType,
      account.amount,
      account.lastPaymentDate || null,
      account.nomineeName || null,
      account.nomineeRelation || null
    );

    return { ...account, id: result.lastInsertRowid as number, deletionStatus: false };
  }

  // Update existing account
  update(id: number, account: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(account).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'accountHolderNames') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
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

  // Soft delete account (set deletionStatus to true)
  delete(id: number): boolean {
    const stmt = this.db.prepare('UPDATE accounts SET deletionStatus = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Hard delete account (permanently remove from database)
  hardDelete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM accounts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Restore deleted account (set deletionStatus to false)
  restore(id: number): boolean {
    const stmt = this.db.prepare('UPDATE accounts SET deletionStatus = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Get accounts count (excluding deleted by default)
  getCount(includeDeleted: boolean = false): number {
    let query = 'SELECT COUNT(*) as count FROM accounts';
    if (!includeDeleted) {
      query += ' WHERE deletionStatus = 0';
    }
    const stmt = this.db.prepare(query);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  // Get accounts by status (excluding deleted by default)
  getByStatus(status: string, includeDeleted: boolean = false): Account[] {
    let query = 'SELECT * FROM accounts WHERE status = ?';
    if (!includeDeleted) {
      query += ' AND deletionStatus = 0';
    }
    query += ' ORDER BY accountHolderNames, accountNumber';
    const stmt = this.db.prepare(query);
    const results = stmt.all(status) as any[];
    
    return results.map(account => ({
      ...account,
      accountHolderNames: JSON.parse(account.accountHolderNames || '[]')
    }));
  }

  // Search accounts (excluding deleted by default)
  search(searchTerm: string, includeDeleted: boolean = false): Account[] {
    let query = `
      SELECT * FROM accounts 
      WHERE (accountNumber LIKE ? OR accountHolderNames LIKE ? OR institutionName LIKE ?)
    `;
    if (!includeDeleted) {
      query += ' AND deletionStatus = 0';
    }
    query += ' ORDER BY accountHolderNames, accountNumber';
    const stmt = this.db.prepare(query);
    const term = `%${searchTerm}%`;
    const results = stmt.all(term, term, term) as any[];
    
    return results.map(account => ({
      ...account,
      accountHolderNames: JSON.parse(account.accountHolderNames || '[]')
    }));
  }

  // Get accounts by institution type (excluding deleted by default)
  getByInstitutionType(institutionType: string, includeDeleted: boolean = false): Account[] {
    let query = 'SELECT * FROM accounts WHERE institutionType = ?';
    if (!includeDeleted) {
      query += ' AND deletionStatus = 0';
    }
    query += ' ORDER BY accountHolderNames, accountNumber';
    const stmt = this.db.prepare(query);
    const results = stmt.all(institutionType) as any[];
    
    return results.map(account => ({
      ...account,
      accountHolderNames: JSON.parse(account.accountHolderNames || '[]')
    }));
  }

  // Get accounts by account type (excluding deleted by default)
  getByAccountType(accountType: string, includeDeleted: boolean = false): Account[] {
    let query = 'SELECT * FROM accounts WHERE accountType = ?';
    if (!includeDeleted) {
      query += ' AND deletionStatus = 0';
    }
    query += ' ORDER BY accountHolderNames, accountNumber';
    const stmt = this.db.prepare(query);
    const results = stmt.all(accountType) as any[];
    
    return results.map(account => ({
      ...account,
      accountHolderNames: JSON.parse(account.accountHolderNames || '[]')
    }));
  }

  // Get accounts by payment type (excluding deleted by default)
  getByPaymentType(paymentType: string, includeDeleted: boolean = false): Account[] {
    let query = 'SELECT * FROM accounts WHERE paymentType = ?';
    if (!includeDeleted) {
      query += ' AND deletionStatus = 0';
    }
    query += ' ORDER BY accountHolderNames, accountNumber';
    const stmt = this.db.prepare(query);
    const results = stmt.all(paymentType) as any[];
    
    return results.map(account => ({
      ...account,
      accountHolderNames: JSON.parse(account.accountHolderNames || '[]')
    }));
  }
} 