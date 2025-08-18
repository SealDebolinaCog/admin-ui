"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopRepository = void 0;
const database_1 = require("./database");
class ShopRepository {
    constructor() {
        this.db = (0, database_1.getDatabase)();
    }
    // Get all shops with optional filtering
    getAll(filters) {
        let query = `
      SELECT * FROM shops 
      WHERE 1=1
    `;
        const params = [];
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
        return stmt.all(params);
    }
    // Get shop by ID
    getById(id) {
        const stmt = this.db.prepare('SELECT * FROM shops WHERE id = ?');
        return stmt.get(id);
    }
    // Create new shop
    create(shop) {
        const stmt = this.db.prepare(`
      INSERT INTO shops (
        shopName, shopType, category, status, ownerName, ownerEmail, ownerPhone,
        addressLine1, addressLine2, addressLine3, state, district, pincode, country
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(shop.shopName, shop.shopType || null, shop.category || null, shop.status, shop.ownerName, shop.ownerEmail || null, shop.ownerPhone || null, shop.addressLine1 || null, shop.addressLine2 || null, shop.addressLine3 || null, shop.state || null, shop.district || null, shop.pincode || null, shop.country || 'India');
        return { ...shop, id: result.lastInsertRowid };
    }
    // Update existing shop
    update(id, shop) {
        const fields = [];
        const values = [];
        Object.entries(shop).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        });
        if (fields.length === 0)
            return false;
        fields.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);
        const query = `UPDATE shops SET ${fields.join(', ')} WHERE id = ?`;
        const stmt = this.db.prepare(query);
        const result = stmt.run(...values);
        return result.changes > 0;
    }
    // Delete shop
    delete(id) {
        const stmt = this.db.prepare('DELETE FROM shops WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // Get shops count
    getCount() {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM shops');
        const result = stmt.get();
        return result.count;
    }
    // Get shops by status
    getByStatus(status) {
        const stmt = this.db.prepare('SELECT * FROM shops WHERE status = ? ORDER BY shopName');
        return stmt.all(status);
    }
    // Search shops
    search(searchTerm) {
        const stmt = this.db.prepare(`
      SELECT * FROM shops 
      WHERE shopName LIKE ? OR ownerName LIKE ?
      ORDER BY shopName
    `);
        const term = `%${searchTerm}%`;
        return stmt.all(term, term);
    }
    // Get shops by type
    getByType(shopType) {
        const stmt = this.db.prepare('SELECT * FROM shops WHERE shopType = ? ORDER BY shopName');
        return stmt.all(shopType);
    }
    // Get shops by category
    getByCategory(category) {
        const stmt = this.db.prepare('SELECT * FROM shops WHERE category = ? ORDER BY shopName');
        return stmt.all(category);
    }
}
exports.ShopRepository = ShopRepository;
//# sourceMappingURL=shops.js.map