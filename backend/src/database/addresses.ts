import Database from 'better-sqlite3';
import path from 'path';
import { Address } from './types';

// Database connection
const DB_PATH = path.join(__dirname, '../../data/admin_ui.db');
const db = new Database(DB_PATH);

export class AddressRepository {
  private db: Database.Database;

  constructor() {
    this.db = db;
  }

  // Get all addresses
  getAll(): Address[] {
    const stmt = this.db.prepare('SELECT * FROM addresses ORDER BY id DESC');
    return stmt.all() as Address[];
  }

  // Get address by ID
  getById(id: number): Address | undefined {
    const stmt = this.db.prepare('SELECT * FROM addresses WHERE id = ?');
    return stmt.get(id) as Address | undefined;
  }

  // Create new address
  create(address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Address {
    const stmt = this.db.prepare(`
      INSERT INTO addresses (
        addressLine1, addressLine2, addressLine3, city, state, district, pincode, country
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      address.addressLine1,
      address.addressLine2 || null,
      address.addressLine3 || null,
      address.city || null,
      address.state,
      address.district,
      address.pincode,
      address.country || 'India'
    );

    return { ...address, id: result.lastInsertRowid as number };
  }

  // Update existing address
  update(id: number, address: Partial<Omit<Address, 'id' | 'createdAt' | 'updatedAt'>>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'addressLine1', 'addressLine2', 'addressLine3', 'city', 'state', 'district', 'pincode', 'country'
    ];

    Object.entries(address).forEach(([key, value]) => {
      if (value !== undefined && allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE addresses SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    const result = stmt.run(...values);

    return result.changes > 0;
  }

  // Delete address
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM addresses WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

export default AddressRepository;
