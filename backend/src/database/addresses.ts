import { getDatabase } from './database';
import Database from 'better-sqlite3';

export interface Address {
  id?: number;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  state?: string;
  district?: string;
  pincode?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class AddressRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  create(address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Address {
    const stmt = this.db.prepare(`
      INSERT INTO addresses (addressLine1, addressLine2, addressLine3, state, district, pincode, country)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      address.addressLine1,
      address.addressLine2 || null,
      address.addressLine3 || null,
      address.state || null,
      address.district || null,
      address.pincode || null,
      address.country || 'India'
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  findById(id: number): Address | null {
    const stmt = this.db.prepare('SELECT * FROM addresses WHERE id = ?');
    return stmt.get(id) as Address | null;
  }

  findAll(): Address[] {
    const stmt = this.db.prepare('SELECT * FROM addresses ORDER BY id DESC');
    return stmt.all() as Address[];
  }

  update(id: number, address: Partial<Omit<Address, 'id' | 'createdAt'>>): Address | null {
    const stmt = this.db.prepare(`
      UPDATE addresses 
      SET addressLine1 = COALESCE(?, addressLine1),
          addressLine2 = COALESCE(?, addressLine2),
          addressLine3 = COALESCE(?, addressLine3),
          state = COALESCE(?, state),
          district = COALESCE(?, district),
          pincode = COALESCE(?, pincode),
          country = COALESCE(?, country),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      address.addressLine1 || null,
      address.addressLine2 || null,
      address.addressLine3 || null,
      address.state || null,
      address.district || null,
      address.pincode || null,
      address.country || null,
      id
    );

    return result.changes > 0 ? this.findById(id) : null;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM addresses WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  findByLocation(state?: string, district?: string, pincode?: string): Address[] {
    let query = 'SELECT * FROM addresses WHERE 1=1';
    const params: any[] = [];

    if (state) {
      query += ' AND state = ?';
      params.push(state);
    }
    if (district) {
      query += ' AND district = ?';
      params.push(district);
    }
    if (pincode) {
      query += ' AND pincode = ?';
      params.push(pincode);
    }

    query += ' ORDER BY id DESC';
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Address[];
  }
}
