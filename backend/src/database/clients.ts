import { getDatabase } from './database';
import { Client } from './types';

export { Client };

export class ClientRepository {
  private db = getDatabase();

  // Get all clients with optional filtering
  getAll(filters?: {
    status?: string;
    search?: string;
    state?: string;
    district?: string;
    includeDeleted?: boolean;
  }): Client[] {
    let query = `
      SELECT 
        c.*,
        a.addressLine1,
        a.addressLine2, 
        a.addressLine3,
        a.city,
        a.state,
        a.district,
        a.pincode,
        a.country
      FROM clients c
      LEFT JOIN addresses a ON c.addressId = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Only show non-deleted records by default
    if (!filters?.includeDeleted) {
      query += ` AND c.deletionStatus = 'active'`;
    }

    if (filters?.status) {
      query += ` AND c.status = ?`;
      params.push(filters.status);
    }

    if (filters?.search) {
      query += ` AND (c.firstName LIKE ? OR c.lastName LIKE ? OR c.middleName LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters?.state) {
      query += ` AND a.state = ?`;
      params.push(filters.state);
    }

    if (filters?.district) {
      query += ` AND a.district = ?`;
      params.push(filters.district);
    }

    query += ` ORDER BY c.firstName, c.lastName`;

    const stmt = this.db.prepare(query);
    return stmt.all(params) as Client[];
  }

  // Get client by ID
  getById(id: number): Client | undefined {
    const query = `
      SELECT 
        c.*,
        a.addressLine1,
        a.addressLine2, 
        a.addressLine3,
        a.city,
        a.state,
        a.district,
        a.pincode,
        a.country
      FROM clients c
      LEFT JOIN addresses a ON c.addressId = a.id
      WHERE c.id = ? AND c.deletionStatus = 'active'
    `;
    const stmt = this.db.prepare(query);
    return stmt.get(id) as Client | undefined;
  }

  // Create new client
  create(client: any): Client {
    const stmt = this.db.prepare(`
      INSERT INTO clients (
        title, firstName, middleName, lastName, dateOfBirth, gender, occupation,
        kycNumber, panNumber, aadhaarNumber, addressId, linkedClientId, status, deletionStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = stmt.run(
      client.title || null,
      client.firstName,
      client.middleName || null,
      client.lastName,
      client.dateOfBirth || null,
      client.gender || null,
      client.occupation || null,
      client.kycNumber || null,
      client.panNumber || null,
      client.aadhaarNumber || null,
      client.addressId || null,
      client.linkedClientId || null,
      client.status || 'active'
    );

    return { ...client, id: result.lastInsertRowid as number, deletionStatus: 'active' };
  }

  // Update existing client
  update(id: number, client: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    // Only allow updating specific fields that exist in the new schema
    const allowedFields = [
      'title', 'firstName', 'middleName', 'lastName', 'dateOfBirth', 'gender', 'occupation',
      'kycNumber', 'panNumber', 'aadhaarNumber', 'addressId', 'linkedClientId', 'status', 'deletionStatus'
    ];

    Object.entries(client).forEach(([key, value]) => {
      if (value !== undefined && allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    const result = stmt.run(...values);

    return result.changes > 0;
  }

  // Soft delete client (set deletionStatus to soft_deleted)
  delete(id: number): boolean {
    const stmt = this.db.prepare('UPDATE clients SET deletionStatus = "soft_deleted", updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Hard delete client (permanently remove from database)
  hardDelete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM clients WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Restore deleted client (set deletionStatus to active)
  restore(id: number): boolean {
    const stmt = this.db.prepare('UPDATE clients SET deletionStatus = "active", updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Get clients count (excluding deleted by default)
  getCount(includeDeleted: boolean = false): number {
    let query = 'SELECT COUNT(*) as count FROM clients';
    if (!includeDeleted) {
      query += ' WHERE deletionStatus = "active"';
    }
    const stmt = this.db.prepare(query);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  // Get clients by status (excluding deleted by default)
  getByStatus(status: string, includeDeleted: boolean = false): Client[] {
    let query = `
      SELECT 
        c.*,
        a.addressLine1,
        a.addressLine2, 
        a.addressLine3,
        a.city,
        a.state,
        a.district,
        a.pincode,
        a.country
      FROM clients c
      LEFT JOIN addresses a ON c.addressId = a.id
      WHERE c.status = ?
    `;
    if (!includeDeleted) {
      query += ' AND c.deletionStatus = "active"';
    }
    query += ' ORDER BY c.firstName, c.lastName';
    const stmt = this.db.prepare(query);
    return stmt.all(status) as Client[];
  }

  // Search clients (excluding deleted by default)
  search(searchTerm: string, includeDeleted: boolean = false): Client[] {
    let query = `
      SELECT 
        c.*,
        a.addressLine1,
        a.addressLine2, 
        a.addressLine3,
        a.city,
        a.state,
        a.district,
        a.pincode,
        a.country
      FROM clients c
      LEFT JOIN addresses a ON c.addressId = a.id
      WHERE (c.firstName LIKE ? OR c.lastName LIKE ? OR c.email LIKE ?)
    `;
    if (!includeDeleted) {
      query += ' AND c.deletionStatus = "active"';
    }
    query += ' ORDER BY c.firstName, c.lastName';
    const stmt = this.db.prepare(query);
    const term = `%${searchTerm}%`;
    return stmt.all(term, term, term) as Client[];
  }

  // Get clients by linked client ID
  getByLinkedClientId(linkedClientId: number): Client[] {
    const query = `
      SELECT 
        c.*,
        a.addressLine1,
        a.addressLine2, 
        a.addressLine3,
        a.city,
        a.state,
        a.district,
        a.pincode,
        a.country
      FROM clients c
      LEFT JOIN addresses a ON c.addressId = a.id
      WHERE c.linkedClientId = ? AND c.deletionStatus = "active"
      ORDER BY c.firstName, c.lastName
    `;
    const stmt = this.db.prepare(query);
    return stmt.all(linkedClientId) as Client[];
  }
} 