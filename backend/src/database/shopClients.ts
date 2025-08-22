import { getDatabase } from './database';

export interface ShopClient {
  id?: number;
  shopId: number;
  clientId: number;
  addedAt?: string;
}

export interface ShopClientWithDetails extends ShopClient {
  clientFirstName: string;
  clientLastName: string;
  clientEmail?: string;
  clientPhone?: string;
  shopName: string;
}

export class ShopClientRepository {
  private db = getDatabase();

  // Add a client to a shop
  addClientToShop(shopId: number, clientId: number): ShopClient {
    const stmt = this.db.prepare(`
      INSERT INTO shop_clients (shopId, clientId)
      VALUES (?, ?)
    `);

    const result = stmt.run(shopId, clientId);
    return { 
      id: result.lastInsertRowid as number,
      shopId, 
      clientId
    };
  }

  // Remove a client from a shop
  removeClientFromShop(shopId: number, clientId: number): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM shop_clients 
      WHERE shopId = ? AND clientId = ?
    `);

    const result = stmt.run(shopId, clientId);
    return result.changes > 0;
  }

  // Get all clients for a specific shop
  getClientsForShop(shopId: number): ShopClientWithDetails[] {
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

    return stmt.all(shopId) as ShopClientWithDetails[];
  }

  // Get all shops for a specific client
  getShopsForClient(clientId: number): ShopClientWithDetails[] {
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

    return stmt.all(clientId) as ShopClientWithDetails[];
  }

  // Check if a client is already associated with a shop
  isClientAssociatedWithShop(shopId: number, clientId: number): boolean {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM shop_clients 
      WHERE shopId = ? AND clientId = ?
    `);

    const result = stmt.get(shopId, clientId) as { count: number };
    return result.count > 0;
  }

  // Get shop-client relationship by ID
  getById(id: number): ShopClientWithDetails | undefined {
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

    return stmt.get(id) as ShopClientWithDetails | undefined;
  }

  // Get count of clients for a shop
  getClientCountForShop(shopId: number): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM shop_clients 
      WHERE shopId = ?
    `);

    const result = stmt.get(shopId) as { count: number };
    return result.count;
  }

  // Get count of shops for a client
  getShopCountForClient(clientId: number): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM shop_clients 
      WHERE clientId = ?
    `);

    const result = stmt.get(clientId) as { count: number };
    return result.count;
  }
} 