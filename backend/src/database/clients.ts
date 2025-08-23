import { getDatabase } from './database';
import Database from 'better-sqlite3';

export interface Client {
  id?: number;
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  kycNumber?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  addressId?: number;
  status?: 'invite_now' | 'pending' | 'active' | 'suspended' | 'deleted';
  linkedClientId?: number;
  linkedClientRelationship?: string;
  deletionStatus?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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
      SELECT * FROM clients 
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
      query += ` AND (firstName LIKE ? OR lastName LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters?.state) {
      query += ` AND state = ?`;
      params.push(filters.state);
    }

    if (filters?.district) {
      query += ` AND district = ?`;
      params.push(filters.district);
    }

    query += ` ORDER BY firstName, lastName`;

    const stmt = this.db.prepare(query);
    return stmt.all(params) as Client[];
  }

  // Get client by ID
  getById(id: number): Client | undefined {
    const stmt = this.db.prepare('SELECT * FROM clients WHERE id = ? AND deletionStatus = 0');
    return stmt.get(id) as Client | undefined;
  }

  // Create a new client
  create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'deletionStatus'>): Client {
    const stmt = this.db.prepare(`
      INSERT INTO clients (
        title, firstName, middleName, lastName, email, phone, kycNumber, panNumber, aadhaarNumber,
        addressId, status, linkedClientId, linkedClientRelationship
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      client.title || null,
      client.firstName,
      client.middleName || null,
      client.lastName,
      client.email || null,
      client.phone || null,
      client.kycNumber || null,
      client.panNumber || null,
      client.aadhaarNumber || null,
      client.addressId || null,
      client.status || 'active',
      client.linkedClientId || null,
      client.linkedClientRelationship || null
    );

    return this.getById(result.lastInsertRowid as number)!;
  }

  // Update existing client
  update(id: number, client: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    console.log('Updating client in repository with ID:', id);
    console.log('Client data to update:', client);

    Object.entries(client).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    
    // Add the id parameter for the WHERE clause
    values.push(id);

    const query = `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`;
    console.log('SQL Query:', query);
    console.log('Values:', values);
    
    const stmt = this.db.prepare(query);
    const result = stmt.run(...values);

    console.log('Update result:', result);
    return result.changes > 0;
  }

  // Soft delete client (set deletionStatus to true)
  delete(id: number): boolean {
    const stmt = this.db.prepare('UPDATE clients SET deletionStatus = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Hard delete client (permanently remove from database)
  hardDelete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM clients WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Restore deleted client (set deletionStatus to false)
  restore(id: number): boolean {
    const stmt = this.db.prepare('UPDATE clients SET deletionStatus = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Get clients count (excluding deleted by default)
  getCount(includeDeleted: boolean = false): number {
    let query = 'SELECT COUNT(*) as count FROM clients';
    if (!includeDeleted) {
      query += ' WHERE deletionStatus = 0';
    }
    const stmt = this.db.prepare(query);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  // Get clients by status (excluding deleted by default)
  getByStatus(status: string, includeDeleted: boolean = false): Client[] {
    let query = 'SELECT * FROM clients WHERE status = ?';
    if (!includeDeleted) {
      query += ' AND deletionStatus = 0';
    }
    query += ' ORDER BY firstName, lastName';
    const stmt = this.db.prepare(query);
    return stmt.all(status) as Client[];
  }

  // Search clients (excluding deleted by default)
  search(searchTerm: string, includeDeleted: boolean = false): Client[] {
    let query = `
      SELECT * FROM clients 
      WHERE (firstName LIKE ? OR lastName LIKE ? OR email LIKE ?)
    `;
    if (!includeDeleted) {
      query += ' AND deletionStatus = 0';
    }
    query += ' ORDER BY firstName, lastName';
    const stmt = this.db.prepare(query);
    const term = `%${searchTerm}%`;
    return stmt.all(term, term, term) as Client[];
  }
} 