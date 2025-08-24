import Database from 'better-sqlite3';
import path from 'path';
import { Contact } from './types';

// Database connection
const DB_PATH = path.join(__dirname, '../../data/admin_ui.db');
const db = new Database(DB_PATH);

export class ContactRepository {
  private db: Database.Database;

  constructor() {
    this.db = db;
  }

  // Get all contacts for a client
  getByClientId(clientId: number): Contact[] {
    const stmt = this.db.prepare('SELECT * FROM contacts WHERE clientId = ? ORDER BY contactPriority DESC, id ASC');
    return stmt.all(clientId) as Contact[];
  }

  // Get contact by ID
  getById(id: number): Contact | undefined {
    const stmt = this.db.prepare('SELECT * FROM contacts WHERE id = ?');
    return stmt.get(id) as Contact | undefined;
  }

  // Get contacts by type for a client
  getByTypeAndClient(type: 'email' | 'phone', clientId: number): Contact[] {
    const stmt = this.db.prepare('SELECT * FROM contacts WHERE type = ? AND clientId = ? ORDER BY contactPriority DESC, id ASC');
    return stmt.all(type, clientId) as Contact[];
  }

  // Get primary contact for a client by type
  getPrimaryContact(type: 'email' | 'phone', clientId: number): Contact | undefined {
    const stmt = this.db.prepare('SELECT * FROM contacts WHERE type = ? AND clientId = ? AND contactPriority = "primary" LIMIT 1');
    return stmt.get(type, clientId) as Contact | undefined;
  }

  // Create new contact
  create(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact {
    const stmt = this.db.prepare(`
      INSERT INTO contacts (
        clientId, type, contactPriority, contactDetails
      ) VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      contact.clientId,
      contact.type,
      contact.contactPriority || null,
      contact.contactDetails
    );

    return { ...contact, id: result.lastInsertRowid as number };
  }

  // Create multiple contacts for a client
  createMultiple(contacts: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[]): Contact[] {
    const stmt = this.db.prepare(`
      INSERT INTO contacts (
        clientId, type, contactPriority, contactDetails
      ) VALUES (?, ?, ?, ?)
    `);

    const createdContacts: Contact[] = [];

    for (const contact of contacts) {
      const result = stmt.run(
        contact.clientId,
        contact.type,
        contact.contactPriority || null,
        contact.contactDetails
      );
      
      createdContacts.push({ ...contact, id: result.lastInsertRowid as number });
    }

    return createdContacts;
  }

  // Update existing contact
  update(id: number, contact: Partial<Omit<Contact, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = ['type', 'contactPriority', 'contactDetails'];

    Object.entries(contact).forEach(([key, value]) => {
      if (value !== undefined && allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    const result = stmt.run(...values);

    return result.changes > 0;
  }

  // Delete contact
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM contacts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Delete all contacts for a client
  deleteByClientId(clientId: number): boolean {
    const stmt = this.db.prepare('DELETE FROM contacts WHERE clientId = ?');
    const result = stmt.run(clientId);
    return result.changes > 0;
  }

  // Set contact as primary (and unset others of same type for same client)
  setPrimary(id: number): boolean {
    const contact = this.getById(id);
    if (!contact) return false;

    // Start transaction
    const transaction = this.db.transaction(() => {
      // Unset all primary contacts of same type for same client
      const unsetStmt = this.db.prepare(`
        UPDATE contacts 
        SET contactPriority = 'secondary', updatedAt = CURRENT_TIMESTAMP 
        WHERE clientId = ? AND type = ? AND contactPriority = 'primary'
      `);
      unsetStmt.run(contact.clientId, contact.type);

      // Set this contact as primary
      const setStmt = this.db.prepare(`
        UPDATE contacts 
        SET contactPriority = 'primary', updatedAt = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      const result = setStmt.run(id);
      
      return result.changes > 0;
    });

    return transaction();
  }
}
