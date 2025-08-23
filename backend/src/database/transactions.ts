import { getDatabase } from './database';
import Database from 'better-sqlite3';

export interface Transaction {
  id?: number;
  accountId: number;
  transactionType: 'deposit' | 'withdrawal' | 'interest' | 'penalty' | 'maturity';
  amount: number;
  transactionDate: string;
  description?: string;
  referenceNumber?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export class TransactionRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (accountId, transactionType, amount, transactionDate, description, referenceNumber, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      transaction.accountId,
      transaction.transactionType,
      transaction.amount,
      transaction.transactionDate,
      transaction.description || null,
      transaction.referenceNumber || null,
      transaction.status
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  findById(id: number): Transaction | null {
    const stmt = this.db.prepare('SELECT * FROM transactions WHERE id = ?');
    return stmt.get(id) as Transaction | null;
  }

  findByAccountId(accountId: number, limit?: number): Transaction[] {
    let query = 'SELECT * FROM transactions WHERE accountId = ? ORDER BY transactionDate DESC, id DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const stmt = this.db.prepare(query);
    return stmt.all(accountId) as Transaction[];
  }

  findByDateRange(startDate: string, endDate: string): Transaction[] {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions 
      WHERE transactionDate BETWEEN ? AND ? 
      ORDER BY transactionDate DESC, id DESC
    `);
    return stmt.all(startDate, endDate) as Transaction[];
  }

  findByType(transactionType: string): Transaction[] {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions 
      WHERE transactionType = ? 
      ORDER BY transactionDate DESC, id DESC
    `);
    return stmt.all(transactionType) as Transaction[];
  }

  findByStatus(status: string): Transaction[] {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions 
      WHERE status = ? 
      ORDER BY transactionDate DESC, id DESC
    `);
    return stmt.all(status) as Transaction[];
  }

  findWithAccountDetails(accountId?: number): any[] {
    let query = `
      SELECT t.*, 
             a.accountNumber, a.accountType,
             i.institutionName, i.institutionType
      FROM transactions t
      JOIN accounts a ON t.accountId = a.id
      JOIN institutions i ON a.institutionId = i.id
    `;
    
    const params: any[] = [];
    if (accountId) {
      query += ' WHERE t.accountId = ?';
      params.push(accountId);
    }
    
    query += ' ORDER BY t.transactionDate DESC, t.id DESC';
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  update(id: number, transaction: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Transaction | null {
    const stmt = this.db.prepare(`
      UPDATE transactions 
      SET transactionType = COALESCE(?, transactionType),
          amount = COALESCE(?, amount),
          transactionDate = COALESCE(?, transactionDate),
          description = COALESCE(?, description),
          referenceNumber = COALESCE(?, referenceNumber),
          status = COALESCE(?, status),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      transaction.transactionType || null,
      transaction.amount || null,
      transaction.transactionDate || null,
      transaction.description || null,
      transaction.referenceNumber || null,
      transaction.status || null,
      id
    );

    return result.changes > 0 ? this.findById(id) : null;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM transactions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  getAccountBalance(accountId: number): number {
    const stmt = this.db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN transactionType IN ('deposit', 'interest') THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN transactionType IN ('withdrawal', 'penalty') THEN amount ELSE 0 END), 0) as balance
      FROM transactions 
      WHERE accountId = ? AND status = 'completed'
    `);
    const result = stmt.get(accountId) as { balance: number };
    return result.balance || 0;
  }

  getTransactionSummary(accountId: number): any {
    const stmt = this.db.prepare(`
      SELECT 
        transactionType,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average
      FROM transactions 
      WHERE accountId = ? AND status = 'completed'
      GROUP BY transactionType
    `);
    return stmt.all(accountId);
  }
}
