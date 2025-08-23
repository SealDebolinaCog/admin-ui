import { Router } from 'express';
import { AccountRepository, type Account } from '../database/accounts';

const router = Router();
const accountRepo = new AccountRepository();

// Get all accounts with optional filtering
router.get('/', (req, res) => {
  try {
    const { status, search, institutionType, accountType, paymentType, tenureRange, clientIds } = req.query;
    
    const filters: any = {};
    if (status) filters.status = status as string;
    if (search) filters.search = search as string;
    if (institutionType) filters.institutionType = institutionType as string;
    if (accountType) filters.accountType = accountType as string;
    if (paymentType) filters.paymentType = paymentType as string;
    if (tenureRange) filters.tenureRange = tenureRange as string;
    if (clientIds) filters.clientIds = (clientIds as string).split(',').map(id => parseInt(id));

    const accounts = accountRepo.getAll(filters);
    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get account by ID
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const account = accountRepo.getById(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get account by account number
router.get('/number/:accountNumber', (req, res) => {
  try {
    const { accountNumber } = req.params;
    const account = accountRepo.getByAccountNumber(accountNumber);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new account
router.post('/', (req, res) => {
  try {
    const accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> = req.body;
    
    // Validate required fields
    if (!accountData.accountNumber || !accountData.institutionId || !accountData.accountType) {
      return res.status(400).json({
        success: false,
        error: 'Account number, holder names, institution type, account type, and institution name are required'
      });
    }

    // Check if account number already exists
    const existingAccount = accountRepo.getByAccountNumber(accountData.accountNumber);
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        error: 'Account number already exists'
      });
    }

    const newAccount = accountRepo.create(accountData);
    res.status(201).json({
      success: true,
      data: newAccount,
      message: 'Account created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update account
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const updateData = req.body;
    
    // If updating account number, check for uniqueness
    if (updateData.accountNumber) {
      const existingAccount = accountRepo.getByAccountNumber(updateData.accountNumber);
      if (existingAccount && existingAccount.id !== id) {
        return res.status(400).json({
          success: false,
          error: 'Account number already exists'
        });
      }
    }

    const success = accountRepo.update(id, updateData);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or no changes made'
      });
    }

    const updatedAccount = accountRepo.getById(id);
    res.json({
      success: true,
      data: updatedAccount,
      message: 'Account updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Soft delete account (set deletionStatus to true)
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const success = accountRepo.delete(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      message: 'Account soft deleted successfully (marked for deletion)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Hard delete account (permanently remove from database)
router.delete('/:id/hard', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const success = accountRepo.hardDelete(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      message: 'Account permanently deleted from database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to hard delete account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Restore deleted account (set deletionStatus to false)
router.post('/:id/restore', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const success = accountRepo.restore(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      message: 'Account restored successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to restore account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get deleted accounts
router.get('/deleted', (req, res) => {
  try {
    const accounts = accountRepo.getAll({ includeDeleted: true });
    const deletedAccounts = accounts.filter(account => account.deletionStatus);
    
    res.json({
      success: true,
      data: deletedAccounts,
      count: deletedAccounts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deleted accounts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get accounts count
router.get('/stats/count', (req, res) => {
  try {
    const count = accountRepo.getCount();
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get account count',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get accounts by status
router.get('/status/:status', (req, res) => {
  try {
    const { status } = req.params;
    const accounts = accountRepo.getByStatus(status);
    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts by status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get accounts by institution type
router.get('/institution/:institutionType', (req, res) => {
  try {
    const { institutionType } = req.params;
    const accounts = accountRepo.getByInstitutionType(institutionType);
    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts by institution type',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get accounts by account type
router.get('/type/:accountType', (req, res) => {
  try {
    const { accountType } = req.params;
    const accounts = accountRepo.getByAccountType(accountType);
    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts by account type',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get accounts by payment type
router.get('/payment/:paymentType', (req, res) => {
  try {
    const { paymentType } = req.params;
    const accounts = accountRepo.getByPaymentType(paymentType);
    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts by payment type',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 