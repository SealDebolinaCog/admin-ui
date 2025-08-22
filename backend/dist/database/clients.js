"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRepository = void 0;
const database_1 = require("./database");
class ClientRepository {
    constructor() {
        this.db = (0, database_1.getDatabase)();
    }
    // Get all clients with optional filtering
    getAll(filters) {
        let query = `
      SELECT * FROM clients 
      WHERE 1=1
    `;
        const params = [];
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
        return stmt.all(params);
    }
    // Get client by ID
    getById(id) {
        const stmt = this.db.prepare('SELECT * FROM clients WHERE id = ?');
        return stmt.get(id);
    }
    // Create new client
    create(client) {
        const stmt = this.db.prepare(`
      INSERT INTO clients (
        firstName, lastName, email, phone, kycNumber, panNumber, aadhaarNumber,
        addressLine1, addressLine2, addressLine3,
        state, district, pincode, country, status,
        linkedClientId, linkedClientName, linkedClientRelationship
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(client.firstName, client.lastName, client.email || null, client.phone || null, client.kycNumber || null, client.panNumber || null, client.aadhaarNumber || null, client.addressLine1 || null, client.addressLine2 || null, client.addressLine3 || null, client.state || null, client.district || null, client.pincode || null, client.country || 'India', client.status, client.linkedClientId || null, client.linkedClientName || null, client.linkedClientRelationship || null);
        return { ...client, id: result.lastInsertRowid };
    }
    // Update existing client
    update(id, client) {
        const fields = [];
        const values = [];
        console.log('Updating client in repository with ID:', id);
        console.log('Client data to update:', client);
        Object.entries(client).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        });
        if (fields.length === 0)
            return false;
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
    // Delete client
    delete(id) {
        const stmt = this.db.prepare('DELETE FROM clients WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // Get clients count
    getCount() {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM clients');
        const result = stmt.get();
        return result.count;
    }
    // Get clients by status
    getByStatus(status) {
        const stmt = this.db.prepare('SELECT * FROM clients WHERE status = ? ORDER BY firstName, lastName');
        return stmt.all(status);
    }
    // Search clients
    search(searchTerm) {
        const stmt = this.db.prepare(`
      SELECT * FROM clients 
      WHERE firstName LIKE ? OR lastName LIKE ? OR email LIKE ?
      ORDER BY firstName, lastName
    `);
        const term = `%${searchTerm}%`;
        return stmt.all(term, term, term);
    }
}
exports.ClientRepository = ClientRepository;
//# sourceMappingURL=clients.js.map