"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopClientRepository = void 0;
const database_1 = require("./database");
class ShopClientRepository {
    constructor() {
        this.db = (0, database_1.getDatabase)();
    }
    // Add a client to a shop
    addClientToShop(shopId, clientId) {
        const stmt = this.db.prepare(`
      INSERT INTO shop_clients (shopId, clientId)
      VALUES (?, ?)
    `);
        const result = stmt.run(shopId, clientId);
        return {
            id: result.lastInsertRowid,
            shopId,
            clientId
        };
    }
    // Remove a client from a shop
    removeClientFromShop(shopId, clientId) {
        const stmt = this.db.prepare(`
      DELETE FROM shop_clients 
      WHERE shopId = ? AND clientId = ?
    `);
        const result = stmt.run(shopId, clientId);
        return result.changes > 0;
    }
    // Get all clients for a specific shop
    getClientsForShop(shopId) {
        const stmt = this.db.prepare(`
      SELECT 
        sc.id,
        sc.shopId,
        sc.clientId,
        sc.addedAt,
        c.firstName as clientFirstName,
        c.lastName as clientLastName,
        c.email as clientEmail,
        c.phone as clientPhone,
        s.shopName
      FROM shop_clients sc
      JOIN clients c ON sc.clientId = c.id
      JOIN shops s ON sc.shopId = s.id
      WHERE sc.shopId = ?
      ORDER BY c.firstName, c.lastName
    `);
        return stmt.all(shopId);
    }
    // Get all shops for a specific client
    getShopsForClient(clientId) {
        const stmt = this.db.prepare(`
      SELECT 
        sc.id,
        sc.shopId,
        sc.clientId,
        sc.addedAt,
        c.firstName as clientFirstName,
        c.lastName as clientLastName,
        c.email as clientEmail,
        c.phone as clientPhone,
        s.shopName
      FROM shop_clients sc
      JOIN clients c ON sc.clientId = c.id
      JOIN shops s ON sc.shopId = s.id
      WHERE sc.clientId = ?
      ORDER BY s.shopName
    `);
        return stmt.all(clientId);
    }
    // Check if a client is already associated with a shop
    isClientAssociatedWithShop(shopId, clientId) {
        const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM shop_clients 
      WHERE shopId = ? AND clientId = ?
    `);
        const result = stmt.get(shopId, clientId);
        return result.count > 0;
    }
    // Get shop-client relationship by ID
    getById(id) {
        const stmt = this.db.prepare(`
      SELECT 
        sc.id,
        sc.shopId,
        sc.clientId,
        sc.addedAt,
        c.firstName as clientFirstName,
        c.lastName as clientLastName,
        c.email as clientEmail,
        c.phone as clientPhone,
        s.shopName
      FROM shop_clients sc
      JOIN clients c ON sc.clientId = c.id
      JOIN shops s ON sc.shopId = s.id
      WHERE sc.id = ?
    `);
        return stmt.get(id);
    }
    // Get count of clients for a shop
    getClientCountForShop(shopId) {
        const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM shop_clients 
      WHERE shopId = ?
    `);
        const result = stmt.get(shopId);
        return result.count;
    }
    // Get count of shops for a client
    getShopCountForClient(clientId) {
        const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM shop_clients 
      WHERE clientId = ?
    `);
        const result = stmt.get(clientId);
        return result.count;
    }
}
exports.ShopClientRepository = ShopClientRepository;
//# sourceMappingURL=shopClients.js.map