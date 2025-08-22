"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clients_1 = require("../database/clients");
const router = (0, express_1.Router)();
const clientRepo = new clients_1.ClientRepository();
// Get all clients with optional filtering
router.get('/', (req, res) => {
    try {
        const { status, search, state, district } = req.query;
        const filters = {};
        if (status)
            filters.status = status;
        if (search)
            filters.search = search;
        if (state)
            filters.state = state;
        if (district)
            filters.district = district;
        const clients = clientRepo.getAll(filters);
        res.json({
            success: true,
            data: clients,
            count: clients.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch clients',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get client by ID
router.get('/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid client ID'
            });
        }
        const client = clientRepo.getById(id);
        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Client not found'
            });
        }
        res.json({
            success: true,
            data: client
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch client',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Create new client
router.post('/', (req, res) => {
    try {
        const clientData = req.body;
        // Validate required fields
        if (!clientData.firstName || !clientData.lastName) {
            return res.status(400).json({
                success: false,
                error: 'First name and last name are required'
            });
        }
        const newClient = clientRepo.create(clientData);
        res.status(201).json({
            success: true,
            data: newClient,
            message: 'Client created successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create client',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Update client
router.put('/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid client ID'
            });
        }
        const updateData = req.body;
        console.log('Updating client with ID:', id);
        console.log('Update data received:', updateData);
        const success = clientRepo.update(id, updateData);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Client not found or no changes made'
            });
        }
        const updatedClient = clientRepo.getById(id);
        console.log('Client updated successfully:', updatedClient);
        res.json({
            success: true,
            data: updatedClient,
            message: 'Client updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update client',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Delete client
router.delete('/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid client ID'
            });
        }
        const success = clientRepo.delete(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Client not found'
            });
        }
        res.json({
            success: true,
            message: 'Client deleted successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete client',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get clients count
router.get('/stats/count', (req, res) => {
    try {
        const count = clientRepo.getCount();
        res.json({
            success: true,
            data: { count }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get client count',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get clients by status
router.get('/status/:status', (req, res) => {
    try {
        const { status } = req.params;
        const clients = clientRepo.getByStatus(status);
        res.json({
            success: true,
            data: clients,
            count: clients.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch clients by status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=clients.js.map