import { Router } from 'express';
import { getDatabase } from '../database/database';
import { ClientRepository } from '../database/clients';

const router = Router();
const clientRepo = new ClientRepository();

// Get all clients with optional filtering
router.get('/', (req, res) => {
  try {
    const { status, search, state, district } = req.query;
    
    const filters: any = {};
    if (status) filters.status = status as string;
    if (search) filters.search = search as string;
    if (state) filters.state = state as string;
    if (district) filters.district = district as string;

    const clients = clientRepo.getAll(filters);
    
    // Disable caching for this endpoint
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({
      success: true,
      data: clients,
      count: clients.length
    });
  } catch (error) {
    console.error('Error in GET /api/clients:', error);
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new client
router.post('/', async (req, res) => {
  try {
    console.log('=== CLIENT CREATION REQUEST ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    
    const { address, contacts, ...clientData } = req.body;
    
    console.log('Extracted data:');
    console.log('- clientData:', clientData);
    console.log('- address:', address);
    console.log('- contacts:', contacts);
    
    // Validate required fields
    if (!clientData.firstName || !clientData.lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }

    let addressId = null;
    
    // Handle address creation if provided
    if (address && (address.addressLine1 || address.state || address.district || address.pincode)) {
      const { AddressRepository } = await import('../database/addresses');
      const addressRepo = new AddressRepository();
      
      const newAddress = addressRepo.create({
        addressLine1: address.addressLine1 || '',
        addressLine2: address.addressLine2 || null,
        addressLine3: address.addressLine3 || null,
        city: address.city || null,
        state: address.state || '',
        district: address.district || '',
        pincode: address.pincode || '',
        country: address.country || 'India'
      });
      
      addressId = newAddress.id;
    }
    
    // Create client with addressId
    const newClient = clientRepo.create({
      ...clientData,
      addressId
    });
    
    // Handle contacts creation if provided
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
      try {
        const { ContactRepository } = await import('../database/contacts');
        const contactRepo = new ContactRepository();
        
        const contactsToCreate = contacts.map(contact => ({
          clientId: newClient.id!,
          type: contact.type,
          contactPriority: contact.contactPriority || null,
          contactDetails: contact.contactDetails
        }));
        
        console.log('Creating contacts:', contactsToCreate);
        const createdContacts = contactRepo.createMultiple(contactsToCreate);
        console.log('Created contacts:', createdContacts);
      } catch (contactError) {
        console.error('Error creating contacts:', contactError);
        // Don't fail the entire client creation if contacts fail
      }
    }
    
    
    res.status(201).json({
      success: true,
      data: newClient,
      message: 'Client created successfully'
    });
  } catch (error) {
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
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update client',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Soft delete client (set deletionStatus to true)
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
      message: 'Client soft deleted successfully (marked for deletion)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete client',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Hard delete client (permanently remove from database)
router.delete('/:id/hard', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client ID'
      });
    }

    const success = clientRepo.hardDelete(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client permanently deleted from database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to hard delete client',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Restore deleted client (set deletionStatus to false)
router.post('/:id/restore', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client ID'
      });
    }

    const success = clientRepo.restore(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client restored successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to restore client',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get deleted clients
router.get('/deleted', (req, res) => {
  try {
    const clients = clientRepo.getAll({ includeDeleted: true });
    const deletedClients = clients.filter(client => client.deletionStatus);
    
    res.json({
      success: true,
      data: deletedClients,
      count: deletedClients.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deleted clients',
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
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients by status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});



export default router; 