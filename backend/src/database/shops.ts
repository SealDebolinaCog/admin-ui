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
  }): Shop[] {
    let query = `
      SELECT * FROM shops 
      WHERE 1=1
    `;
    const params: any[] = [];

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
    const stmt = this.db.prepare('SELECT * FROM shops WHERE id = ?');
    return stmt.get(id) as Shop | undefined;
  }

  // Create new shop
  create(shop: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>): Shop {
    const stmt = this.db.prepare(`
      INSERT INTO shops (
        shopName, shopType, category, status, ownerName, ownerEmail, ownerPhone,
        addressLine1, addressLine2, addressLine3, state, district, pincode, country
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    return { ...shop, id: result.lastInsertRowid as number };
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

  // Delete shop
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM shops WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Get shops count
  getCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM shops');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  // Get shops by status
  getByStatus(status: string): Shop[] {
    const stmt = this.db.prepare('SELECT * FROM shops WHERE status = ? ORDER BY shopName');
    return stmt.all(status) as Shop[];
  }

  // Search shops
  search(searchTerm: string): Shop[] {
    const stmt = this.db.prepare(`
      SELECT * FROM shops 
      WHERE shopName LIKE ? OR ownerName LIKE ?
      ORDER BY shopName
    `);
    const term = `%${searchTerm}%`;
    return stmt.all(term, term) as Shop[];
  }

  // Get shops by type
  getByType(shopType: string): Shop[] {
    const stmt = this.db.prepare('SELECT * FROM shops WHERE shopType = ? ORDER BY shopName');
    return stmt.all(shopType) as Shop[];
  }

  // Get shops by category
  getByCategory(category: string): Shop[] {
    const stmt = this.db.prepare('SELECT * FROM shops WHERE category = ? ORDER BY shopName');
    return stmt.all(category) as Shop[];
  }
} 