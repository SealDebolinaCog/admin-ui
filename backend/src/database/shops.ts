import { getDatabase } from './database';

export interface Shop {
  id?: number;
  shopName: string;
  shopType?: string;
  category?: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  state?: string;
  district?: string;
  pincode?: string;
  country?: string;
  deletionStatus?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class ShopRepository {
  private db = getDatabase();

  // Get all shops with optional filtering
  getAll(filters?: {
    status?: string;
    search?: string;
    shopType?: string;
    category?: string;
    state?: string;
    district?: string;
    includeDeleted?: boolean;
  }): Shop[] {
    let query = `
      SELECT * FROM shops 
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
      query += ` AND (shopName LIKE ? OR ownerName LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters?.shopType) {
      query += ` AND shopType = ?`;
      params.push(filters.shopType);
    }

    if (filters?.category) {
      query += ` AND category = ?`;
      params.push(filters.category);
    }

    if (filters?.state) {
      query += ` AND state = ?`;
      params.push(filters.state);
    }

    if (filters?.district) {
      query += ` AND district = ?`;
      params.push(filters.district);
    }

    query += ` ORDER BY shopName`;

    const stmt = this.db.prepare(query);
    return stmt.all(params) as Shop[];
  }

  // Get shop by ID
  getById(id: number): Shop | undefined {
    const stmt = this.db.prepare('SELECT * FROM shops WHERE id = ? AND deletionStatus = 0');
    return stmt.get(id) as Shop | undefined;
  }

  // Create new shop
  create(shop: Omit<Shop, 'id' | 'createdAt' | 'updatedAt' | 'deletionStatus'>): Shop {
    const stmt = this.db.prepare(`
      INSERT INTO shops (
        shopName, shopType, category, status, ownerName, ownerEmail, ownerPhone,
        addressLine1, addressLine2, addressLine3, state, district, pincode, country, deletionStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    const result = stmt.run(
      shop.shopName,
      shop.shopType || null,
      shop.category || null,
      shop.status,
      shop.ownerName,
      shop.ownerEmail || null,
      shop.ownerPhone || null,
      shop.addressLine1 || null,
      shop.addressLine2 || null,
      shop.addressLine3 || null,
      shop.state || null,
      shop.district || null,
      shop.pincode || null,
      shop.country || 'India'
    );

    return { ...shop, id: result.lastInsertRowid as number, deletionStatus: false };
  }

  // Update existing shop
  update(id: number, shop: Partial<Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(shop).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE shops SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    const result = stmt.run(...values);

    return result.changes > 0;
  }

  // Soft delete shop (set deletionStatus to true)
  delete(id: number): boolean {
    const stmt = this.db.prepare('UPDATE shops SET deletionStatus = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Hard delete shop (permanently remove from database)
  hardDelete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM shops WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Restore deleted shop (set deletionStatus to false)
  restore(id: number): boolean {
    const stmt = this.db.prepare('UPDATE shops SET deletionStatus = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Get shops count (excluding deleted by default)
  getCount(includeDeleted: boolean = false): number {
    let query = 'SELECT COUNT(*) as count FROM shops';
    if (!includeDeleted) {
      query += ' WHERE deletionStatus = 0';
    }
    const stmt = this.db.prepare(query);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  // Get shops by status (excluding deleted by default)
  getByStatus(status: string, includeDeleted: boolean = false): Shop[] {
    let query = 'SELECT * FROM shops WHERE status = ?';
    if (!includeDeleted) {
      query += ' AND deletionStatus = 0';
    }
    query += ' ORDER BY shopName';
    const stmt = this.db.prepare(query);
    return stmt.all(status) as Shop[];
  }

  // Search shops (excluding deleted by default)
  search(searchTerm: string, includeDeleted: boolean = false): Shop[] {
    let query = `
      SELECT * FROM shops 
      WHERE (shopName LIKE ? OR ownerName LIKE ?)
    `;
    if (!includeDeleted) {
      query += ' AND deletionStatus = 0';
    }
    query += ' ORDER BY shopName';
    const stmt = this.db.prepare(query);
    const term = `%${searchTerm}%`;
    return stmt.all(term, term) as Shop[];
  }

  // Get shops by type (excluding deleted by default)
  getByType(shopType: string, includeDeleted: boolean = false): Shop[] {
    let query = 'SELECT * FROM shops WHERE shopType = ?';
    if (!includeDeleted) {
      query += ' AND deletionStatus = 0';
    }
    query += ' ORDER BY shopName';
    const stmt = this.db.prepare(query);
    return stmt.all(shopType) as Shop[];
  }

  // Get shops by category (excluding deleted by default)
  getByCategory(category: string, includeDeleted: boolean = false): Shop[] {
    let query = 'SELECT * FROM shops WHERE category = ?';
    if (!includeDeleted) {
      query += ' AND deletionStatus = 0';
    }
    query += ' ORDER BY shopName';
    const stmt = this.db.prepare(query);
    return stmt.all(category) as Shop[];
  }
} 