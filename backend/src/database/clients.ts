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
        a.country,
        contacts_email.contactDetails as email,
        contacts_phone.contactDetails as phone
      FROM clients c
      LEFT JOIN addresses a ON c.addressId = a.id
      LEFT JOIN contacts contacts_email ON c.id = contacts_email.clientId 
        AND contacts_email.type = 'email' 
        AND contacts_email.contactPriority = 'primary'
      LEFT JOIN contacts contacts_phone ON c.id = contacts_phone.clientId 
        AND contacts_phone.type = 'phone' 
        AND contacts_phone.contactPriority = 'primary'
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
    const clients = stmt.all(params) as Client[];
    
    // Get contacts for each client
    if (clients.length > 0) {
      const contactsQuery = `
        SELECT clientId, id, type, contactPriority, contactDetails
        FROM contacts 
        WHERE clientId IN (${clients.map(() => '?').join(',')})
        ORDER BY 
          clientId,
          CASE WHEN contactPriority = 'primary' THEN 0 ELSE 1 END,
          type
      `;
      const contactsStmt = this.db.prepare(contactsQuery);
      const allContacts = contactsStmt.all(clients.map(c => c.id));
      
      // Group contacts by clientId
      const contactsByClient = allContacts.reduce((acc: any, contact: any) => {
        if (!acc[contact.clientId]) acc[contact.clientId] = [];
        acc[contact.clientId].push(contact);
        return acc;
      }, {});
      
      // Add contacts to each client
      clients.forEach(client => {
        (client as any).contacts = contactsByClient[client.id] || [];
      });
      
      // Get linked client names for clients that have linkedClientId
      const clientsWithLinks = clients.filter(c => c.linkedClientId);
      if (clientsWithLinks.length > 0) {
        const linkedClientIds = clientsWithLinks.map(c => c.linkedClientId);
        const linkedClientsQuery = `
          SELECT id, title, firstName, middleName, lastName
          FROM clients 
          WHERE id IN (${linkedClientIds.map(() => '?').join(',')}) AND deletionStatus = 'active'
        `;
        const linkedClientsStmt = this.db.prepare(linkedClientsQuery);
        const linkedClients = linkedClientsStmt.all(linkedClientIds) as any[];
        
        // Create a map of linked client names
        const linkedClientNames = linkedClients.reduce((acc: any, linkedClient: any) => {
          const name = [
            linkedClient.title,
            linkedClient.firstName,
            linkedClient.middleName,
            linkedClient.lastName
          ].filter(Boolean).join(' ');
          acc[linkedClient.id] = name;
          return acc;
        }, {});
        
        // Add linked client names to clients
        clients.forEach(client => {
          if (client.linkedClientId && linkedClientNames[client.linkedClientId]) {
            (client as any).linkedClientName = linkedClientNames[client.linkedClientId];
          }
        });
      }
    }
    
    return clients;
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
        a.country,
        contacts_email.contactDetails as email,
        contacts_phone.contactDetails as phone
      FROM clients c
      LEFT JOIN addresses a ON c.addressId = a.id
      LEFT JOIN contacts contacts_email ON c.id = contacts_email.clientId 
        AND contacts_email.type = 'email' 
        AND contacts_email.contactPriority = 'primary'
      LEFT JOIN contacts contacts_phone ON c.id = contacts_phone.clientId 
        AND contacts_phone.type = 'phone' 
        AND contacts_phone.contactPriority = 'primary'
      WHERE c.id = ? AND c.deletionStatus = 'active'
    `;
    const stmt = this.db.prepare(query);
    const client = stmt.get(id) as Client | undefined;
    
    if (client) {
      // Get all contacts for this client
      const contactsQuery = `
        SELECT id, type, contactPriority, contactDetails
        FROM contacts 
        WHERE clientId = ?
        ORDER BY 
          CASE WHEN contactPriority = 'primary' THEN 0 ELSE 1 END,
          type
      `;
      const contactsStmt = this.db.prepare(contactsQuery);
      const contacts = contactsStmt.all(id);
      (client as any).contacts = contacts;
      
      // Get linked client information if linkedClientId exists
      if (client.linkedClientId) {
        const linkedClientQuery = `
          SELECT id, title, firstName, middleName, lastName
          FROM clients 
          WHERE id = ? AND deletionStatus = 'active'
        `;
        const linkedClientStmt = this.db.prepare(linkedClientQuery);
        const linkedClient = linkedClientStmt.get(client.linkedClientId) as any;
        if (linkedClient) {
          const linkedClientName = [
            linkedClient.title,
            linkedClient.firstName,
            linkedClient.middleName,
            linkedClient.lastName
          ].filter(Boolean).join(' ');
          (client as any).linkedClientName = linkedClientName;
        }
      }
      
      // Get all clients that are linked TO this client (reverse relationships)
      const reverseLinkedQuery = `
        SELECT id, title, firstName, middleName, lastName, linkedClientId, linkedClientRelationship
        FROM clients 
        WHERE linkedClientId = ? AND deletionStatus = 'active'
      `;
      const reverseLinkedStmt = this.db.prepare(reverseLinkedQuery);
      const reverseLinkedClients = reverseLinkedStmt.all(id) as any[];
      
      // Combine primary linked client and reverse linked clients
      const allLinkedClients = [];
      
      // Add primary linked client with actual relationship type
      if (client.linkedClientId && (client as any).linkedClientName) {
        allLinkedClients.push({
          id: client.linkedClientId,
          name: (client as any).linkedClientName,
          relationshipType: client.linkedClientRelationship || 'other'
        });
      }
      
      // Add reverse linked clients with their relationship types
      reverseLinkedClients.forEach((reverseClient: any) => {
        const name = [
          reverseClient.title,
          reverseClient.firstName,
          reverseClient.middleName,
          reverseClient.lastName
        ].filter(Boolean).join(' ');
        
        allLinkedClients.push({
          id: reverseClient.id,
          name: name,
          relationshipType: reverseClient.linkedClientRelationship || 'other'
        });
      });
      
      (client as any).allLinkedClients = allLinkedClients;
    }
    
    return client;
  }

  // Create new client
  create(client: any): Client {
    const stmt = this.db.prepare(`
      INSERT INTO clients (
        title, firstName, middleName, lastName, dateOfBirth, gender, occupation,
        kycNumber, panNumber, aadhaarNumber, addressId, linkedClientId, linkedClientRelationship, status, deletionStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
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
      client.linkedClientRelationship || null,
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
      'kycNumber', 'panNumber', 'aadhaarNumber', 'addressId', 'linkedClientId', 'linkedClientRelationship', 'status', 'deletionStatus'
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