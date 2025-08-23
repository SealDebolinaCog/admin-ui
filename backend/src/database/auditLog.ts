import { getDatabase } from './database';
import Database from 'better-sqlite3';

export interface AuditLog {
  id?: number;
  tableName: string;
  recordId: number;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE';
  oldValues?: string; // JSON string
  newValues?: string; // JSON string
  userId?: string;
  timestamp?: string;
}

export class AuditLogRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  create(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const stmt = this.db.prepare(`
      INSERT INTO audit_log (tableName, recordId, operation, oldValues, newValues, userId)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      auditLog.tableName,
      auditLog.recordId,
      auditLog.operation,
      auditLog.oldValues || null,
      auditLog.newValues || null,
      auditLog.userId || null
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  findById(id: number): AuditLog | null {
    const stmt = this.db.prepare('SELECT * FROM audit_log WHERE id = ?');
    return stmt.get(id) as AuditLog | null;
  }

  findByTable(tableName: string, limit?: number): AuditLog[] {
    let query = 'SELECT * FROM audit_log WHERE tableName = ? ORDER BY timestamp DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const stmt = this.db.prepare(query);
    return stmt.all(tableName) as AuditLog[];
  }

  findByRecord(tableName: string, recordId: number): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log 
      WHERE tableName = ? AND recordId = ? 
      ORDER BY timestamp DESC
    `);
    return stmt.all(tableName, recordId) as AuditLog[];
  }

  findByOperation(operation: string): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log 
      WHERE operation = ? 
      ORDER BY timestamp DESC
    `);
    return stmt.all(operation) as AuditLog[];
  }

  findByUser(userId: string): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log 
      WHERE userId = ? 
      ORDER BY timestamp DESC
    `);
    return stmt.all(userId) as AuditLog[];
  }

  findByDateRange(startDate: string, endDate: string): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log 
      WHERE timestamp BETWEEN ? AND ? 
      ORDER BY timestamp DESC
    `);
    return stmt.all(startDate, endDate) as AuditLog[];
  }

  findAll(limit?: number): AuditLog[] {
    let query = 'SELECT * FROM audit_log ORDER BY timestamp DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const stmt = this.db.prepare(query);
    return stmt.all() as AuditLog[];
  }

  // Helper method to log changes
  logChange(
    tableName: string,
    recordId: number,
    operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE',
    oldValues?: any,
    newValues?: any,
    userId?: string
  ): AuditLog {
    return this.create({
      tableName,
      recordId,
      operation,
      oldValues: oldValues ? JSON.stringify(oldValues) : undefined,
      newValues: newValues ? JSON.stringify(newValues) : undefined,
      userId
    });
  }

  // Clean up old audit logs (optional maintenance)
  deleteOlderThan(days: number): number {
    const stmt = this.db.prepare(`
      DELETE FROM audit_log 
      WHERE timestamp < datetime('now', '-${days} days')
    `);
    const result = stmt.run();
    return result.changes;
  }
}
