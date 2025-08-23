import { getDatabase } from './database';
import Database from 'better-sqlite3';

export interface Institution {
  id?: number;
  institutionName: string;
  institutionType: 'bank' | 'post_office';
  branchCode?: string;
  ifscCode?: string;
  addressId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export class InstitutionRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  create(institution: Omit<Institution, 'id' | 'createdAt' | 'updatedAt'>): Institution {
    const stmt = this.db.prepare(`
      INSERT INTO institutions (institutionName, institutionType, branchCode, ifscCode, addressId)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      institution.institutionName,
      institution.institutionType,
      institution.branchCode || null,
      institution.ifscCode || null,
      institution.addressId || null
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  findById(id: number): Institution | null {
    const stmt = this.db.prepare('SELECT * FROM institutions WHERE id = ?');
    return stmt.get(id) as Institution | null;
  }

  findAll(): Institution[] {
    const stmt = this.db.prepare('SELECT * FROM institutions ORDER BY institutionName');
    return stmt.all() as Institution[];
  }

  findByType(type: 'bank' | 'post_office'): Institution[] {
    const stmt = this.db.prepare('SELECT * FROM institutions WHERE institutionType = ? ORDER BY institutionName');
    return stmt.all(type) as Institution[];
  }

  findByIfscCode(ifscCode: string): Institution | null {
    const stmt = this.db.prepare('SELECT * FROM institutions WHERE ifscCode = ?');
    return stmt.get(ifscCode) as Institution | null;
  }

  update(id: number, institution: Partial<Omit<Institution, 'id' | 'createdAt'>>): Institution | null {
    const stmt = this.db.prepare(`
      UPDATE institutions 
      SET institutionName = COALESCE(?, institutionName),
          institutionType = COALESCE(?, institutionType),
          branchCode = COALESCE(?, branchCode),
          ifscCode = COALESCE(?, ifscCode),
          addressId = COALESCE(?, addressId),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      institution.institutionName || null,
      institution.institutionType || null,
      institution.branchCode || null,
      institution.ifscCode || null,
      institution.addressId || null,
      id
    );

    return result.changes > 0 ? this.findById(id) : null;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM institutions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  findWithAddress(): any[] {
    const stmt = this.db.prepare(`
      SELECT i.*, 
             a.addressLine1, a.addressLine2, a.addressLine3,
             a.state, a.district, a.pincode, a.country
      FROM institutions i
      LEFT JOIN addresses a ON i.addressId = a.id
      ORDER BY i.institutionName
    `);
    return stmt.all();
  }
}
