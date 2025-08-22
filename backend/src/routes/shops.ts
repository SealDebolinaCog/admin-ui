import { Router } from 'express';
import { ShopRepository, type Shop } from '../database/shops';
import { ShopClientRepository } from '../database/shopClients';

const router = Router();
const shopRepo = new ShopRepository();
const shopClientRepo = new ShopClientRepository();

// Get all shops with optional filtering
router.get('/', (req, res) => {
  try {
    const { status, search, shopType, category, state, district } = req.query;
    
    const filters: any = {};
    if (status) filters.status = status as string;
    if (search) filters.search = search as string;
    if (shopType) filters.shopType = shopType as string;
    if (category) filters.category = category as string;
    if (state) filters.state = state as string;
    if (district) filters.district = district as string;

    const shops = shopRepo.getAll(filters);
    res.json({
      success: true,
      data: shops,
      count: shops.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shops',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get shop by ID
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    const shop = shopRepo.getById(id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }

    res.json({
      success: true,
      data: shop
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shop',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new shop
router.post('/', (req, res) => {
  try {
    const shopData: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'> = req.body;
    
    // Validate required fields
    if (!shopData.shopName || !shopData.ownerName) {
      return res.status(400).json({
        success: false,
        error: 'Shop name and owner name are required'
      });
    }

    const newShop = shopRepo.create(shopData);
    res.status(201).json({
      success: true,
      data: newShop,
      message: 'Shop created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create shop',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update shop
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    const updateData = req.body;
    const success = shopRepo.update(id, updateData);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found or no changes made'
      });
    }

    const updatedShop = shopRepo.getById(id);
    res.json({
      success: true,
      data: updatedShop,
      message: 'Shop updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update shop',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Soft delete shop (set deletionStatus to true)
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    const success = shopRepo.delete(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }

    res.json({
      success: true,
      message: 'Shop soft deleted successfully (marked for deletion)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete shop',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Hard delete shop (permanently remove from database)
router.delete('/:id/hard', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    const success = shopRepo.hardDelete(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }

    res.json({
      success: true,
      message: 'Shop permanently deleted from database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to hard delete shop',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Restore deleted shop (set deletionStatus to false)
router.post('/:id/restore', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    const success = shopRepo.restore(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }

    res.json({
      success: true,
      message: 'Shop restored successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to restore shop',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get deleted shops
router.get('/deleted', (req, res) => {
  try {
    const shops = shopRepo.getAll({ includeDeleted: true });
    const deletedShops = shops.filter(shop => shop.deletionStatus);
    
    res.json({
      success: true,
      data: deletedShops,
      count: deletedShops.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deleted shops',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get shops count
router.get('/stats/count', (req, res) => {
  try {
    const count = shopRepo.getCount();
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

// Get shops by status
router.get('/status/:status', (req, res) => {
  try {
    const { status } = req.params;
    const shops = shopRepo.getByStatus(status);
    res.json({
      success: true,
      data: shops,
      count: shops.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shops by status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get shops by type
router.get('/type/:shopType', (req, res) => {
  try {
    const { shopType } = req.params;
    const shops = shopRepo.getByType(shopType);
    res.json({
      success: true,
      data: shops,
      count: shops.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shops by type',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get shops by category
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const shops = shopRepo.getByCategory(category);
    res.json({
      success: true,
      data: shops,
      count: shops.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shops by category',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get clients linked to a shop
router.get('/:id/clients', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    const clients = shopClientRepo.getClientsForShop(id);
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

export default router; 