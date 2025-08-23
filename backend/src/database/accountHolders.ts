import { getDatabase } from './database';
import Database from 'better-sqlite3';

export interface AccountHolder {
  id?: number;
  accountId: number;
  clientId: number;
  holderType: 'primary' | 'secondary' | 'nominee';
  addedAt?: string;
}

export class AccountHolderRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  create(accountHolder: Omit<AccountHolder, 'id' | 'addedAt'>): AccountHolder {
    const stmt = this.db.prepare(`
      INSERT INTO account_holders (accountId, clientId, holderType)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      accountHolder.accountId,
      accountHolder.clientId,
      accountHolder.holderType
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  findById(id: number): AccountHolder | null {
    const stmt = this.db.prepare('SELECT * FROM account_holders WHERE id = ?');
    return stmt.get(id) as AccountHolder | null;
  }

  findByAccountId(accountId: number): AccountHolder[] {
    const stmt = this.db.prepare('SELECT * FROM account_holders WHERE accountId = ? ORDER BY holderType');
    return stmt.all(accountId) as AccountHolder[];
  }

  findByClientId(clientId: number): AccountHolder[] {
    const stmt = this.db.prepare('SELECT * FROM account_holders WHERE clientId = ? ORDER BY addedAt DESC');
    return stmt.all(clientId) as AccountHolder[];
  }

  findAccountHoldersWithDetails(accountId: number): any[] {
    const stmt = this.db.prepare(`
      SELECT ah.*, 
             c.firstName, c.lastName, c.email, c.phone
      FROM account_holders ah
      JOIN clients c ON ah.clientId = c.id
      WHERE ah.accountId = ?
      ORDER BY ah.holderType
    `);
    return stmt.all(accountId);
  }

  findClientAccountsWithDetails(clientId: number): any[] {
    const stmt = this.db.prepare(`
      SELECT ah.*, 
             a.accountNumber, a.accountType, a.status as accountStatus,
             i.institutionName, i.institutionType
      FROM account_holders ah
      JOIN accounts a ON ah.accountId = a.id
      JOIN institutions i ON a.institutionId = i.id
      WHERE ah.clientId = ? AND a.deletionStatus = 0
      ORDER BY ah.addedAt DESC
    `);
    return stmt.all(clientId);
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM account_holders WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  deleteByAccountAndClient(accountId: number, clientId: number): boolean {
    const stmt = this.db.prepare('DELETE FROM account_holders WHERE accountId = ? AND clientId = ?');
    const result = stmt.run(accountId, clientId);
    return result.changes > 0;
  }

  updateHolderType(id: number, holderType: 'primary' | 'secondary' | 'nominee'): AccountHolder | null {
    const stmt = this.db.prepare(`
      UPDATE account_holders 
      SET holderType = ?
      WHERE id = ?
    `);

    const result = stmt.run(holderType, id);
    return result.changes > 0 ? this.findById(id) : null;
  }
}
