import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './UserManagement.css';
import AccountForm from './AccountForm';

// Account interface
interface Account {
  id: number;
  accountNumber: string;
  accountHolderName: string;
  accountType: 'savings' | 'current' | 'fixed' | 'recurring' | 'business';
  bankName: string;
  branchCode: string;
  ifscCode: string;
  balance: number;
  status: 'active' | 'suspended' | 'closed';
  openingDate: string;
  lastTransactionDate: string;
  email: string;
  phone: string;
  address: string;
  nomineeName?: string;
  nomineeRelation?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
}

const AccountsManagement: React.FC = () => {
  // State variables
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchFilter, setSearchFilter] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // New state variables for account actions
  const [showViewAccount, setShowViewAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    accountType: '',
    status: '',
    bankName: '',
    kycStatus: '',
    balanceRange: ''
  });

  // Mock data for accounts
  const mockAccounts = useMemo((): Account[] => [
    {
      id: 1,
      accountNumber: '1234567890',
      accountHolderName: 'Rajesh Kumar',
      accountType: 'savings',
      bankName: 'State Bank of India',
      branchCode: 'SBI001',
      ifscCode: 'SBIN0001234',
      balance: 125000,
      status: 'active',
      openingDate: '2020-03-15',
      lastTransactionDate: '2024-01-20',
      email: 'rajesh.kumar@email.com',
      phone: '9876543210',
      address: '123 Main Street, Kolkata, West Bengal 700001',
      nomineeName: 'Priya Kumar',
      nomineeRelation: 'Spouse',
      kycStatus: 'verified'
    },
    {
      id: 2,
      accountNumber: '0987654321',
      accountHolderName: 'Priya Sharma',
      accountType: 'current',
      bankName: 'HDFC Bank',
      branchCode: 'HDFC001',
      ifscCode: 'HDFC0000987',
      balance: 450000,
      status: 'active',
      openingDate: '2019-07-22',
      lastTransactionDate: '2024-01-19',
      email: 'priya.sharma@email.com',
      phone: '8765432109',
      address: '456 Park Avenue, Mumbai, Maharashtra 400001',
      nomineeName: 'Amit Sharma',
      nomineeRelation: 'Father',
      kycStatus: 'verified'
    },
    {
      id: 3,
      accountNumber: '1122334455',
      accountHolderName: 'Amit Patel',
      accountType: 'business',
      bankName: 'ICICI Bank',
      branchCode: 'ICICI001',
      ifscCode: 'ICIC0001122',
      balance: 850000,
      status: 'suspended',
      openingDate: '2021-11-08',
      lastTransactionDate: '2024-01-10',
      email: 'amit.patel@business.com',
      phone: '7654321098',
      address: '789 Business Park, Delhi, Delhi 110001',
      nomineeName: 'Neha Patel',
      nomineeRelation: 'Wife',
      kycStatus: 'pending'
    },
    {
      id: 4,
      accountNumber: '5566778899',
      accountHolderName: 'Neha Singh',
      accountType: 'fixed',
      bankName: 'Axis Bank',
      branchCode: 'AXIS001',
      ifscCode: 'AXIS0005566',
      balance: 2000000,
      status: 'active',
      openingDate: '2022-05-12',
      lastTransactionDate: '2024-01-15',
      email: 'neha.singh@email.com',
      phone: '6543210987',
      address: '321 Garden Road, Bangalore, Karnataka 560001',
      nomineeName: 'Rahul Singh',
      nomineeRelation: 'Brother',
      kycStatus: 'verified'
    },
    {
      id: 5,
      accountNumber: '9988776655',
      accountHolderName: 'Rahul Verma',
      accountType: 'recurring',
      bankName: 'Kotak Mahindra Bank',
      branchCode: 'KOTAK001',
      ifscCode: 'KOTAK0009988',
      balance: 75000,
      status: 'active',
      openingDate: '2023-01-30',
      lastTransactionDate: '2024-01-18',
      email: 'rahul.verma@email.com',
      phone: '5432109876',
      address: '654 Lake View, Hyderabad, Telangana 500001',
      nomineeName: 'Sunita Verma',
      nomineeRelation: 'Mother',
      kycStatus: 'verified'
    }
  ], []);

  // Fetch accounts with filtering and sorting
  const fetchAccounts = useCallback(() => {
    setLoading(true);
    try {
      let filteredAccounts = [...mockAccounts];

      // Apply search filter
      if (searchFilter.trim()) {
        filteredAccounts = filteredAccounts.filter(account =>
          account.accountNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
          account.accountHolderName.toLowerCase().includes(searchFilter.toLowerCase()) ||
          account.bankName.toLowerCase().includes(searchFilter.toLowerCase())
        );
      }

      // Apply advanced filters
      if (filters.accountType) {
        filteredAccounts = filteredAccounts.filter(account => account.accountType === filters.accountType);
      }
      if (filters.status) {
        filteredAccounts = filteredAccounts.filter(account => account.status === filters.status);
      }
      if (filters.bankName) {
        filteredAccounts = filteredAccounts.filter(account => account.bankName.toLowerCase().includes(filters.bankName.toLowerCase()));
      }
      if (filters.kycStatus) {
        filteredAccounts = filteredAccounts.filter(account => account.kycStatus === filters.kycStatus);
      }
      if (filters.balanceRange) {
        const [min, max] = filters.balanceRange.split('-').map(Number);
        if (max) {
          filteredAccounts = filteredAccounts.filter(account => account.balance >= min && account.balance <= max);
        } else {
          filteredAccounts = filteredAccounts.filter(account => account.balance >= min);
        }
      }

      // Sort accounts: first by status (active first), then alphabetically by account holder name
      filteredAccounts.sort((a, b) => {
        // First sort by status: active comes first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;

        // Then sort alphabetically by account holder name
        return a.accountHolderName.localeCompare(b.accountHolderName);
      });

      setAccounts(filteredAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  }, [searchFilter, filters, mockAccounts]);

  // Load accounts on component mount and when filters change
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAccounts();
  };

  // Handle add account
  const handleAddAccount = (accountData: any) => {
    const account: Account = {
      id: Date.now(),
      accountNumber: accountData.accountNumber,
      accountHolderName: accountData.accountHolderName,
      accountType: accountData.accountType,
      bankName: accountData.bankName,
      branchCode: accountData.branchCode,
      ifscCode: accountData.ifscCode,
      balance: accountData.balance || 0,
      status: accountData.status || 'active',
      openingDate: accountData.openingDate || new Date().toISOString().split('T')[0],
      lastTransactionDate: new Date().toISOString().split('T')[0],
      email: accountData.email,
      phone: accountData.phone,
      address: `${accountData.address.addressLine1}, ${accountData.address.district}, ${accountData.address.state} ${accountData.address.pincode}`,
      nomineeName: accountData.nomineeName,
      nomineeRelation: accountData.nomineeRelation,
      kycStatus: 'pending'
    };
    setAccounts([...accounts, account]);
  };

  // Delete account
  const deleteAccount = async (accountId: number) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        const index = mockAccounts.findIndex(account => account.id === accountId);
        if (index > -1) {
          mockAccounts.splice(index, 1);
          fetchAccounts();
        }
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  // View account details
  const viewAccount = (account: Account) => {
    setSelectedAccount(account);
    setShowViewAccount(true);
  };

  // Edit account
  const editAccount = (account: Account) => {
    setSelectedAccount(account);
    // Close view modal if it's open, then open edit modal
    if (showViewAccount) {
      setShowViewAccount(false);
    }
    setShowEditAccount(true);
  };

  // Suspend/Activate account
  const toggleAccountStatus = (accountId: number) => {
    const account = mockAccounts.find(a => a.id === accountId);
    if (account) {
      const newStatus = account.status === 'active' ? 'suspended' : 'active';
      const action = newStatus === 'suspended' ? 'suspend' : 'activate';
      
      if (window.confirm(`Are you sure you want to ${action} this account?`)) {
        account.status = newStatus;
        fetchAccounts();
      }
    }
  };

  // Handle edit account submission
  const handleEditAccount = (accountData: any) => {
    if (selectedAccount) {
      const index = mockAccounts.findIndex(account => account.id === selectedAccount.id);
      if (index > -1) {
        mockAccounts[index] = {
          ...mockAccounts[index],
          accountNumber: accountData.accountNumber,
          accountHolderName: accountData.accountHolderName,
          accountType: accountData.accountType,
          bankName: accountData.bankName,
          branchCode: accountData.branchCode,
          ifscCode: accountData.ifscCode,
          balance: accountData.balance || 0,
          status: accountData.status || mockAccounts[index].status,
          email: accountData.email,
          phone: accountData.phone,
          address: `${accountData.address.addressLine1}, ${accountData.address.district}, ${accountData.address.state} ${accountData.address.pincode}`,
          nomineeName: accountData.nomineeName,
          nomineeRelation: accountData.nomineeRelation
        };
        fetchAccounts();
        setShowEditAccount(false);
        
        // Update selectedAccount with new data and show view modal
        const updatedAccount = mockAccounts[index];
        setSelectedAccount(updatedAccount);
        setShowViewAccount(true);
      }
    }
  };

  // Close all account modals and reset state
  const closeAllAccountModals = () => {
    setShowViewAccount(false);
    setShowEditAccount(false);
    setSelectedAccount(null);
  };

  // Filter functions
  const applyFilters = () => {
    setCurrentPage(1);
    fetchAccounts();
  };

  const clearFilters = () => {
    setFilters({
      accountType: '',
      status: '',
      bankName: '',
      kycStatus: '',
      balanceRange: ''
    });
    setCurrentPage(1);
    fetchAccounts();
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  // Helper functions
  const getAccountTypeDisplay = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'savings': 'Savings',
      'current': 'Current',
      'fixed': 'Fixed Deposit',
      'recurring': 'Recurring Deposit',
      'business': 'Business'
    };
    return typeMap[type] || type;
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': 'Active',
      'suspended': 'Suspended',
      'closed': 'Closed'
    };
    return statusMap[status] || status;
  };

  const getKYCStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'verified': 'Verified',
      'rejected': 'Rejected'
    };
    return statusMap[status] || status;
  };

  const getAccountInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate pagination
  const totalRecords = accounts.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentAccounts = accounts.slice(startIndex, endIndex);

  // Debug logging
  console.log('Accounts state:', accounts);
  console.log('Current accounts:', currentAccounts);
  console.log('Total records:', totalRecords);
  console.log('Current page:', currentPage);
  console.log('Records per page:', recordsPerPage);

  if (loading) {
    return (
      <div className="users-management">
        <div className="loading">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="users-management">
      {/* Header */}
      <div className="users-header">
        <div className="header-content">
          <h1>Account Management</h1>
          <p>Manage bank accounts, view details, and monitor status</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            Total Accounts: {accounts.length} | Current Page: {currentPage} | Showing: {currentAccounts.length}
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="add-user-btn"
            onClick={() => setShowAddForm(true)}
          >
            + Add Account
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters-container">
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by account number, holder name, or bank..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                🔍
              </button>
            </div>
          </form>
        </div>

        <div className="filters-section">
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </button>
          <button 
            className="view-toggle-btn"
            onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
          >
            {viewMode === 'cards' ? '📊 Table' : '🃏 Cards'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Account Type</label>
              <select
                value={filters.accountType}
                onChange={(e) => setFilters(prev => ({ ...prev, accountType: e.target.value }))}
              >
                <option value="">All Types</option>
                <option value="savings">Savings</option>
                <option value="current">Current</option>
                <option value="fixed">Fixed Deposit</option>
                <option value="recurring">Recurring Deposit</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Bank Name</label>
              <input
                type="text"
                placeholder="Enter bank name"
                value={filters.bankName}
                onChange={(e) => setFilters(prev => ({ ...prev, bankName: e.target.value }))}
              />
            </div>

            <div className="filter-group">
              <label>KYC Status</label>
              <select
                value={filters.kycStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, kycStatus: e.target.value }))}
              >
                <option value="">All KYC Statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Balance Range</label>
              <select
                value={filters.balanceRange}
                onChange={(e) => setFilters(prev => ({ ...prev, balanceRange: e.target.value }))}
              >
                <option value="">All Balances</option>
                <option value="0-50000">₹0 - ₹50,000</option>
                <option value="50000-200000">₹50,000 - ₹2,00,000</option>
                <option value="200000-500000">₹2,00,000 - ₹5,00,000</option>
                <option value="500000-1000000">₹5,00,000 - ₹10,00,000</option>
                <option value="1000000-">₹10,00,000+</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button onClick={applyFilters} className="apply-filters-btn">
              Apply Filters
            </button>
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Add Account Form */}
      {showAddForm && (
        <AccountForm
          isOpen={showAddForm}
          onClose={() => {
            setShowAddForm(false);
          }}
          onSubmit={handleAddAccount}
          mode="add"
        />
      )}

      {/* Edit Account Form */}
      {showEditAccount && selectedAccount && (
        <AccountForm
          isOpen={showEditAccount}
          onClose={() => {
            setShowEditAccount(false);
            // Return to view mode instead of clearing selectedAccount
            setShowViewAccount(true);
          }}
          onSubmit={handleEditAccount}
          mode="edit"
          initialData={{
            accountNumber: selectedAccount.accountNumber,
            accountHolderName: selectedAccount.accountHolderName,
            accountType: selectedAccount.accountType,
            bankName: selectedAccount.bankName,
            branchCode: selectedAccount.branchCode,
            ifscCode: selectedAccount.ifscCode,
            balance: selectedAccount.balance,
            status: selectedAccount.status as any,
            email: selectedAccount.email,
            phone: selectedAccount.phone,
            address: {
              addressLine1: selectedAccount.address?.split(',')[0] || '',
              addressLine2: '',
              addressLine3: '',
              state: selectedAccount.address?.split(',')[1]?.trim() || 'West Bengal',
              district: selectedAccount.address?.split(',')[1]?.trim() || 'Nadia',
              pincode: selectedAccount.address?.split(',')[2]?.trim() || '741501',
              country: 'India'
            },
            nomineeName: selectedAccount.nomineeName || '',
            nomineeRelation: selectedAccount.nomineeRelation || ''
          }}
        />
      )}

      {/* View Account Modal */}
      {showViewAccount && selectedAccount && (
        <div className="shop-form-overlay">
          <div className="shop-form-modal">
            <div className="shop-form-header">
              <h2>Account Details</h2>
              <button className="close-button" onClick={closeAllAccountModals}>×</button>
            </div>
            
            <div className="shop-form" style={{ padding: '32px' }}>
              <div className="form-section">
                <h4>Account Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Account Number:</span>
                  <span className="detail-value">{selectedAccount.accountNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Account Type:</span>
                  <span className="detail-value">{getAccountTypeDisplay(selectedAccount.accountType)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">
                    <span className={`status-badge ${selectedAccount.status || 'active'}`}>
                      {selectedAccount.status === 'active' ? '🟢 Active' : selectedAccount.status === 'suspended' ? '🟠 Suspended' : '🔴 Closed'}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Balance:</span>
                  <span className="detail-value">₹{selectedAccount.balance.toLocaleString()}</span>
                </div>
              </div>

              <div className="form-section">
                <h4>Account Holder Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedAccount.accountHolderName}</span>
                </div>
                {selectedAccount.email && (
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedAccount.email}</span>
                  </div>
                )}
                {selectedAccount.phone && (
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedAccount.phone}</span>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h4>Bank Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Bank Name:</span>
                  <span className="detail-value">{selectedAccount.bankName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Branch Code:</span>
                  <span className="detail-value">{selectedAccount.branchCode}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">IFSC Code:</span>
                  <span className="detail-value">{selectedAccount.ifscCode}</span>
                </div>
              </div>

              <div className="form-section">
                <h4>Additional Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Opening Date:</span>
                  <span className="detail-value">{selectedAccount.openingDate}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last Transaction:</span>
                  <span className="detail-value">{selectedAccount.lastTransactionDate}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">KYC Status:</span>
                  <span className="detail-value">
                    <span className={`status-badge ${selectedAccount.kycStatus}`}>
                      {selectedAccount.kycStatus === 'verified' ? '🟢 Verified' : selectedAccount.kycStatus === 'pending' ? '🟡 Pending' : '🔴 Rejected'}
                    </span>
                  </span>
                </div>
                {selectedAccount.nomineeName && (
                  <div className="detail-row">
                    <span className="detail-label">Nominee:</span>
                    <span className="detail-value">{selectedAccount.nomineeName} ({selectedAccount.nomineeRelation})</span>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => editAccount(selectedAccount)}
                  className="btn-primary"
                >
                  ✏️ Edit Account
                </button>
                <button 
                  type="button" 
                  onClick={closeAllAccountModals}
                  className="btn-cancel"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Display */}
      {viewMode === 'cards' ? (
        <div className="users-cards-container">
          {(currentAccounts.length > 0 ? currentAccounts : accounts).map((account: Account) => (
            <div key={account.id} className="user-card">
              <div className="user-card-header">
                <div className="user-avatar">
                  <span className="avatar-initials">
                    {getAccountInitials(account.accountHolderName)}
                  </span>
                </div>
                <div className="user-info">
                  <h3 className="user-name">{account.accountHolderName}</h3>
                  <p className="user-email">{account.accountNumber}</p>
                  <p className="user-role">{getAccountTypeDisplay(account.accountType)}</p>
                </div>
                <div className="user-status">
                  <span className={`status-badge ${account.status}`}>
                    {account.status === 'active' ? '🟢' : account.status === 'suspended' ? '🟠' : '🔴'} {getStatusDisplay(account.status)}
                  </span>
                </div>
              </div>
              
              <div className="user-card-body">
                <div className="user-details">
                  <div className="detail-item">
                    <span className="detail-label">Bank:</span>
                    <span className="detail-value">{account.bankName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Balance:</span>
                    <span className="detail-value">₹{account.balance.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">KYC:</span>
                    <span className="detail-value">
                      <span className={`status-badge ${account.kycStatus}`}>
                        {getKYCStatusDisplay(account.kycStatus)}
                      </span>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{account.address}</span>
                  </div>
                </div>
              </div>
              
              <div className="user-actions">
                <button 
                  className="action-btn view-btn"
                  title="View account details"
                  onClick={() => viewAccount(account)}
                >
                  👁️
                </button>
                <button 
                  className="action-btn edit-btn"
                  title="Edit account"
                  onClick={() => editAccount(account)}
                >
                  ✏️
                </button>
                <button 
                  className="action-btn suspend-btn"
                  title={account.status === 'active' ? 'Suspend account' : 'Activate account'}
                  onClick={() => toggleAccountStatus(account.id)}
                >
                  {account.status === 'active' ? '⏸️' : '▶️'}
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={() => deleteAccount(account.id)}
                  title="Delete account"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Holder</th>
                <th>Type</th>
                <th>Bank</th>
                <th>Balance</th>
                <th>Status</th>
                <th>KYC</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(currentAccounts.length > 0 ? currentAccounts : accounts).map((account: Account) => (
                <tr key={account.id} className="user-row">
                  <td className="client-info">
                    <div className="client-avatar">
                      <span className="table-avatar-initials">
                        {getAccountInitials(account.accountHolderName)}
                      </span>
                    </div>
                    <div className="client-name">
                      {account.accountNumber}
                    </div>
                  </td>
                  <td className="address-cell">
                    <div className="cell-content">
                      {account.accountHolderName}
                    </div>
                  </td>
                  <td className="mobile-cell">
                    <div className="cell-content">
                      {getAccountTypeDisplay(account.accountType)}
                    </div>
                  </td>
                  <td className="address-cell">
                    <div className="cell-content">
                      {account.bankName}
                    </div>
                  </td>
                  <td className="mobile-cell">
                    <div className="cell-content">
                      ₹{account.balance.toLocaleString()}
                    </div>
                  </td>
                  <td className="status-cell">
                    <span className={`table-status-badge ${account.status || 'active'}`}>
                      {account.status === 'active' ? '🟢' : account.status === 'suspended' ? '🟠' : '🔴'} {getStatusDisplay(account.status || 'active')}
                    </span>
                  </td>
                  <td className="status-cell">
                    <span className={`table-status-badge ${account.kycStatus}`}>
                      {account.kycStatus === 'verified' ? '🟢' : account.kycStatus === 'pending' ? '🟡' : '🔴'} {getKYCStatusDisplay(account.kycStatus)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="table-actions">
                      <button 
                        className="table-action-btn view-btn"
                        title="View account details"
                        onClick={() => viewAccount(account)}
                      >
                        👁️
                      </button>
                      <button 
                        className="table-action-btn edit-btn"
                        title="Edit account"
                        onClick={() => editAccount(account)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="table-action-btn suspend-btn"
                        title={account.status === 'active' ? 'Suspend account' : 'Activate account'}
                        onClick={() => toggleAccountStatus(account.id)}
                      >
                        {account.status === 'active' ? '⏸️' : '▶️'}
                      </button>
                      <button 
                        className="table-action-btn delete-btn"
                        onClick={() => deleteAccount(account.id)}
                        title="Delete account"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span>
              Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} accounts
            </span>
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            <span className="pagination-current">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {accounts.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🏦</div>
          <h3>No accounts found</h3>
          <p>Get started by adding your first account</p>
          <button 
            className="add-first-user-btn"
            onClick={() => setShowAddForm(true)}
          >
            Add First Account
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountsManagement; 