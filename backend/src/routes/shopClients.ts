import { Router } from 'express';
import { ShopClientRepository, type ShopClient } from '../database/shopClients';

const router = Router();
const shopClientRepo = new ShopClientRepository();

// Get all clients for a specific shop
router.get('/shop/:shopId', (req, res) => {
  try {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    const clients = shopClientRepo.getClientsForShop(shopId);
    res.json({
      success: true,
      data: clients,
      count: clients.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shop clients',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all shops for a specific client
router.get('/client/:clientId', (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client ID'
      });
    }

    const shops = shopClientRepo.getShopsForClient(clientId);
    res.json({
      success: true,
      data: shops,
      count: shops.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client shops',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a client to a shop
router.post('/', (req, res) => {
  try {
    const { shopId, clientId } = req.body;
    
    // Validate required fields
    if (!shopId || !clientId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID and Client ID are required'
      });
    }

    // Check if client is already associated with this shop
    if (shopClientRepo.isClientAssociatedWithShop(shopId, clientId)) {
      return res.status(400).json({
        success: false,
        error: 'Client is already associated with this shop'
      });
    }

    const shopClient = shopClientRepo.addClientToShop(shopId, clientId);
    res.status(201).json({
      success: true,
      data: shopClient,
      message: 'Client added to shop successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add client to shop',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Remove a client from a shop
router.delete('/shop/:shopId/client/:clientId', (req, res) => {
  try {
    const shopId = parseInt(req.params.shopId);
    const clientId = parseInt(req.params.clientId);
    
    if (isNaN(shopId) || isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID or client ID'
      });
    }

    const success = shopClientRepo.removeClientFromShop(shopId, clientId);
    if (success) {
      res.json({
        success: true,
        message: 'Client removed from shop successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Client not found in shop'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove client from shop',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get relationship by ID
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid relationship ID'
      });
    }

    const relationship = shopClientRepo.getById(id);
    if (relationship) {
      res.json({
        success: true,
        data: relationship
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Relationship not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch relationship',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get client count for a shop
router.get('/shop/:shopId/count', (req, res) => {
  try {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    const count = shopClientRepo.getClientCountForShop(shopId);
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

// Get shop count for a client
router.get('/client/:clientId/count', (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client ID'
      });
    }

    const count = shopClientRepo.getShopCountForClient(clientId);
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get shop count',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 