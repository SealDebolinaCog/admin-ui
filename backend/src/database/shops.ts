import { getDatabase } from './database';
import { Shop } from './types';

export { Shop };

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
      SELECT 
        s.*,
        a.addressLine1,
        a.addressLine2, 
        a.addressLine3,
        a.city,
        a.state,
        a.district,
        a.pincode,
        a.country,
        c.firstName as ownerFirstName,
        c.lastName as ownerLastName,
        c.email as ownerEmail,
        c.phoneNumber as ownerPhone
      FROM shops s
      LEFT JOIN addresses a ON s.addressId = a.id
      LEFT JOIN clients c ON s.ownerId = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Only show non-deleted records by default
    if (!filters?.includeDeleted) {
      query += ` AND s.deletionStatus = 'active'`;
    }

    if (filters?.status) {
      query += ` AND s.status = ?`;
      params.push(filters.status);
    }

    if (filters?.search) {
      query += ` AND (s.shopName LIKE ? OR c.firstName LIKE ? OR c.lastName LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters?.shopType) {
      query += ` AND s.shopType = ?`;
      params.push(filters.shopType);
    }

    if (filters?.category) {
      query += ` AND s.category = ?`;
      params.push(filters.category);
    }

    if (filters?.state) {
      query += ` AND a.state = ?`;
      params.push(filters.state);
    }

    if (filters?.district) {
      query += ` AND a.district = ?`;
      params.push(filters.district);
    }

    query += ` ORDER BY s.shopName`;

    const stmt = this.db.prepare(query);
    return stmt.all(params) as Shop[];
  }

  // Get shop by ID
  getById(id: number): Shop | undefined {
    const query = `
      SELECT 
        s.*,
        a.addressLine1,
        a.addressLine2, 
        a.addressLine3,
        a.city,
        a.state,
        a.district,
        a.pincode,
        a.country,
        c.firstName as ownerFirstName,
        c.lastName as ownerLastName,
        c.email as ownerEmail,
        c.phoneNumber as ownerPhone
      FROM shops s
      LEFT JOIN addresses a ON s.addressId = a.id
      LEFT JOIN clients c ON s.ownerId = c.id
      WHERE s.id = ? AND s.deletionStatus = 'active'
    `;
    const stmt = this.db.prepare(query);
    return stmt.get(id) as Shop | undefined;
  }

  // Create new shop
  create(shop: any): Shop {
    const stmt = this.db.prepare(`
      INSERT INTO shops (
        shopName, shopType, category, status, ownerId, addressId, deletionStatus
      ) VALUES (?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = stmt.run(
      shop.shopName,
      shop.shopType || null,
      shop.category || null,
      shop.status,
      shop.ownerId,
      shop.addressId || null
    );

    return { ...shop, id: result.lastInsertRowid as number, deletionStatus: 'active' };
  }

  // Update existing shop
  update(id: number, shop: Partial<Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    // Only allow updating specific fields that exist in the new schema
    const allowedFields = [
      'shopName', 'shopType', 'category', 'status', 'ownerId', 'addressId', 'deletionStatus'
    ];

    Object.entries(shop).forEach(([key, value]) => {
      if (value !== undefined && allowedFields.includes(key)) {
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

  // Soft delete shop (set deletionStatus to soft_deleted)
  delete(id: number): boolean {
    const stmt = this.db.prepare('UPDATE shops SET deletionStatus = "soft_deleted", updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Hard delete shop (permanently remove from database)
  hardDelete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM shops WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Restore deleted shop (set deletionStatus to active)
  restore(id: number): boolean {
    const stmt = this.db.prepare('UPDATE shops SET deletionStatus = "active", updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Get shops count (excluding deleted by default)
  getCount(includeDeleted: boolean = false): number {
    let query = 'SELECT COUNT(*) as count FROM shops';
    if (!includeDeleted) {
      query += ' WHERE deletionStatus = "active"';
    }
    const stmt = this.db.prepare(query);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  // Get shops by status (excluding deleted by default)
  getByStatus(status: string, includeDeleted: boolean = false): Shop[] {
    let query = `
      SELECT 
        s.*,
        a.addressLine1,
        a.addressLine2, 
        a.addressLine3,
        a.city,
        a.state,
        a.district,
        a.pincode,
        a.country,
        c.firstName as ownerFirstName,
        c.lastName as ownerLastName,
        c.email as ownerEmail,
        c.phoneNumber as ownerPhone
      FROM shops s
      LEFT JOIN addresses a ON s.addressId = a.id
      LEFT JOIN clients c ON s.ownerId = c.id
      WHERE s.status = ?
    `;
    if (!includeDeleted) {
      query += ' AND s.deletionStatus = "active"';
    }
    query += ' ORDER BY s.shopName';
    const stmt = this.db.prepare(query);
    return stmt.all(status) as Shop[];
  }

  // Search shops (excluding deleted by default)
  search(searchTerm: string, includeDeleted: boolean = false): Shop[] {
    let query = `
      SELECT 
        s.*,
        a.addressLine1,
        a.addressLine2, 
        a.addressLine3,
        a.city,
        a.state,
        a.district,
        a.pincode,
        a.country,
        c.firstName as ownerFirstName,
        c.lastName as ownerLastName,
        c.email as ownerEmail,
        c.phoneNumber as ownerPhone
      FROM shops s
      LEFT JOIN addresses a ON s.addressId = a.id
      LEFT JOIN clients c ON s.ownerId = c.id
      WHERE (s.shopName LIKE ? OR c.firstName LIKE ? OR c.lastName LIKE ?)
    `;
    if (!includeDeleted) {
      query += ' AND s.deletionStatus = "active"';
    }
    query += ' ORDER BY s.shopName';
    const stmt = this.db.prepare(query);
    const term = `%${searchTerm}%`;
    return stmt.all(term, term, term) as Shop[];
  }

  // Get shops by type (excluding deleted by default)
  getByType(shopType: string, includeDeleted: boolean = false): Shop[] {
    let query = `
      SELECT 
        s.*,
        a.addressLine1,
        a.addressLine2, 
        a.addressLine3,
        a.city,
        a.state,
        a.district,
        a.pincode,
        a.country,
        c.firstName as ownerFirstName,
        c.lastName as ownerLastName,
        c.email as ownerEmail,
        c.phoneNumber as ownerPhone
      FROM shops s
      LEFT JOIN addresses a ON s.addressId = a.id
      LEFT JOIN clients c ON s.ownerId = c.id
      WHERE s.shopType = ?
    `;
    if (!includeDeleted) {
      query += ' AND s.deletionStatus = "active"';
    }
    query += ' ORDER BY s.shopName';
    const stmt = this.db.prepare(query);
    return stmt.all(shopType) as Shop[];
  }

  // Get shops by category (excluding deleted by default)
  getByCategory(category: string, includeDeleted: boolean = false): Shop[] {
    let query = `
      SELECT 
        s.*,
        a.addressLine1,
        a.addressLine2, 
        a.addressLine3,
        a.city,
        a.state,
        a.district,
        a.pincode,
        a.country,
        c.firstName as ownerFirstName,
        c.lastName as ownerLastName,
        c.email as ownerEmail,
        c.phoneNumber as ownerPhone
      FROM shops s
      LEFT JOIN addresses a ON s.addressId = a.id
      LEFT JOIN clients c ON s.ownerId = c.id
      WHERE s.category = ?
    `;
    if (!includeDeleted) {
      query += ' AND s.deletionStatus = "active"';
    }
    query += ' ORDER BY s.shopName';
    const stmt = this.db.prepare(query);
    return stmt.all(category) as Shop[];
  }

  // Get shops by owner ID
  getByOwnerId(ownerId: number): Shop[] {
    const query = `
      SELECT 
        s.*,
        a.addressLine1,
        a.addressLine2, 
        a.addressLine3,
        a.city,
        a.state,
        a.district,
        a.pincode,
        a.country,
        c.firstName as ownerFirstName,
        c.lastName as ownerLastName,
        c.email as ownerEmail,
        c.phoneNumber as ownerPhone
      FROM shops s
      LEFT JOIN addresses a ON s.addressId = a.id
      LEFT JOIN clients c ON s.ownerId = c.id
      WHERE s.ownerId = ? AND s.deletionStatus = "active"
      ORDER BY s.shopName
    `;
    const stmt = this.db.prepare(query);
    return stmt.all(ownerId) as Shop[];
  }
} 