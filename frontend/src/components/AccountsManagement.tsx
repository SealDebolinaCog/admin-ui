import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './UserManagement.css';
import AccountForm from './AccountForm';

// Account interface
interface Account {
  id: number;
  accountNumber: string;
  accountOwnershipType: 'single' | 'joint';
  accountHolderNames: string[];
  institutionType: 'bank' | 'post_office';
  accountType: 'savings' | 'current' | 'fixed' | 'recurring' | 'business' | 'recurring_deposit' | '1td' | '2td' | '3td' | '4td' | '5td' | 'national_savings_certificate' | 'kishan_vikash_patra' | 'monthly_income_scheme';
  institutionName: string;
  branchCode: string;
  ifscCode?: string; // Only for banks
  tenure: number;
  status: 'active' | 'suspended' | 'fined' | 'matured' | 'closed';
  openingDate: string;
  lastTransactionDate: string;
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
    institutionType: '',
    accountType: '',
    status: '',
    institutionName: '',
    kycStatus: '',
    tenureRange: ''
  });

  // Map backend account to UI account shape
  const mapBackendAccountToUI = (a: any): Account => {
    console.log('mapBackendAccountToUI', a);
    return {
      id: a.id,
      accountNumber: a.accountNumber,
      accountOwnershipType: a.accountOwnershipType,
      accountHolderNames: Array.isArray(a.accountHolderNames) ? a.accountHolderNames : 
        (typeof a.accountHolderNames === 'string' ? a.accountHolderNames.split(',').map((name: string) => name.trim()) : []),
      institutionType: a.institutionType,
      accountType: a.accountType as Account['accountType'],
      institutionName: a.institutionName,
      branchCode: a.branchCode || '',
      ifscCode: a.ifscCode || undefined,
      tenure: a.tenure ?? 0,
      status: a.status,
      openingDate: a.startDate || a.createdAt || '',
      lastTransactionDate: a.lastPaymentDate || a.updatedAt || '',
      address: '',
      nomineeName: a.nomineeName || undefined,
      nomineeRelation: a.nomineeRelation || undefined,
      kycStatus: 'pending'
    };
  };

  // Fetch accounts with filtering and sorting
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters for filtering
      const params = new URLSearchParams();
      if (searchFilter.trim()) {
        params.append('search', searchFilter.trim());
      }
      if (filters.institutionType) {
        params.append('institutionType', filters.institutionType);
      }
      if (filters.accountType) {
        params.append('accountType', filters.accountType);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.tenureRange) {
        params.append('tenureRange', filters.tenureRange);
      }

      // Fetch accounts from backend API
      const response = await fetch(`/api/accounts?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch accounts');
      }

      // Map backend data to UI format
      const mappedAccounts = data.data.map(mapBackendAccountToUI);
      console.log('mappedAccounts', mappedAccounts);
      // Apply local filters that aren't supported by backend
      let filteredAccounts = mappedAccounts;
      if (filters.institutionName) {
        filteredAccounts = filteredAccounts.filter((account: Account) => 
          account.institutionName.toLowerCase().includes(filters.institutionName.toLowerCase())
        );
      }
      if (filters.kycStatus) {
        filteredAccounts = filteredAccounts.filter((account: Account) => 
          account.kycStatus === filters.kycStatus
        );
      }

      // Sort accounts: first by status (active first), then alphabetically by first account holder name
      filteredAccounts.sort((a: Account, b: Account) => {
        // First sort by status: active comes first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;

        // Then sort alphabetically by first account holder name
        return (a.accountHolderNames[0] || '').localeCompare(b.accountHolderNames[0] || '');
      });

      setAccounts(filteredAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      // Set empty array on error
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [searchFilter, filters]);

  // Load accounts on component mount and when filters change
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAccounts();
  };

  // Handle add account (create in backend then refresh)
  const handleAddAccount = async (accountData: any) => {
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: accountData.accountNumber,
          accountOwnershipType: accountData.accountOwnershipType,
          accountHolderNames: accountData.accountHolderNames,
          institutionType: accountData.institutionType,
          accountType: accountData.accountType,
          institutionName: accountData.institutionName,
          branchCode: accountData.branchCode || null,
          ifscCode: accountData.ifscCode || null,
          tenure: accountData.tenure || 12,
          status: accountData.status || 'active',
          startDate: accountData.startDate || null,
          maturityDate: null,
          paymentType: 'monthly',
          amount: 0,
          lastPaymentDate: null,
          nomineeName: accountData.nomineeName || null,
          nomineeRelation: accountData.nomineeRelation || null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to add account');
      }

      // Refresh the accounts list
      fetchAccounts();
      setShowAddForm(false);
      console.log('Account added successfully');
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Failed to add account. Please try again.');
    }
  };

  // Handle delete account
  const deleteAccount = async (accountId: number) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        const response = await fetch(`/api/accounts/${accountId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete account');
        }

        // Refresh the accounts list
        fetchAccounts();
        console.log(`Account with ID ${accountId} deleted successfully.`);
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please try again.');
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
  const toggleAccountStatus = async (accountId: number) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      const newStatus = account.status === 'active' ? 'suspended' : 'active';
      const action = newStatus === 'active' ? 'activate' : 'suspend';
      
      if (window.confirm(`Are you sure you want to ${action} this account?`)) {
        try {
          const response = await fetch(`/api/accounts/${accountId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error || 'Failed to update account status');
          }

          // Refresh the accounts list
          fetchAccounts();
          console.log(`Account with ID ${accountId} status changed to ${newStatus}`);
        } catch (error) {
          console.error('Error updating account status:', error);
          alert('Failed to update account status. Please try again.');
        }
      }
    }
  };

  // Handle edit account
  const handleEditAccount = async (accountData: any) => {
    if (selectedAccount) {
      try {
        const response = await fetch(`/api/accounts/${selectedAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountNumber: accountData.accountNumber,
            accountOwnershipType: accountData.accountOwnershipType,
            accountHolderNames: accountData.accountHolderNames,
            institutionType: accountData.institutionType,
            accountType: accountData.accountType,
            institutionName: accountData.institutionName,
            branchCode: accountData.branchCode,
            ifscCode: accountData.ifscCode,
            tenure: accountData.tenure || 12,
            status: accountData.status || selectedAccount.status,
            startDate: accountData.startDate,
            maturityDate: accountData.maturityDate,
            paymentType: accountData.paymentType,
            amount: accountData.amount,
            lastPaymentDate: accountData.lastPaymentDate,
            nomineeName: accountData.nomineeName,
            nomineeRelation: accountData.nomineeRelation
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to update account');
        }

        // Refresh the accounts list
        fetchAccounts();
        setShowEditAccount(false);
        
        // Update selectedAccount with new data and show view modal
        const updatedAccount = result.data;
        setSelectedAccount(updatedAccount);
        setShowViewAccount(true);
        
        console.log('Account updated successfully');
      } catch (error) {
        console.error('Error updating account:', error);
        alert('Failed to update account. Please try again.');
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
      institutionType: '',
      accountType: '',
      status: '',
      institutionName: '',
      kycStatus: '',
      tenureRange: ''
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
      // Bank Account Types
      'savings': 'Savings Account',
      'current': 'Current Account',
      'fixed': 'Fixed Deposit',
      'recurring': 'Recurring Deposit',
      'business': 'Business Account',
      // Post Office Account Types
      'savings_certificate': 'Savings Certificate',
      'recurring_deposit': 'Recurring Deposit',
      'time_deposit': 'Time Deposit',
      'monthly_income_scheme': 'Monthly Income Scheme',
      'senior_citizen_savings': 'Senior Citizen Savings'
    };
    return typeMap[type] || type;
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': 'Active',
      'suspended': 'Suspended',
      'fined': 'Fined',
      'matured': 'Matured',
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
        <div>
          <h1>Accounts</h1>
          <p>Manage bank and post office accounts</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card View"
            >
              📋
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              📊
            </button>
          </div>
          <form 
            className="search-input-container"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              if (searchFilter.length >= 3) {
                fetchAccounts();
              }
              
              // Maintain focus
              setTimeout(() => {
                if (searchInputRef.current) {
                  searchInputRef.current.focus();
                }
              }, 0);
              
              return false;
            }}
          >
            <span className="search-icon">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search accounts by number or holder name (min 3 letters)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="search-input"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="clear-search"
                title="Clear search"
              >
                ✕
              </button>
            )}
            {searchFilter && searchFilter.length > 0 && searchFilter.length < 3 && (
              <div className="search-validation-message">
                Enter at least 3 characters to search
              </div>
            )}
          </form>
          <button 
            className={`filter-toggle-btn ${getActiveFilterCount() > 0 ? 'has-filters' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </button>
          <button 
            className="add-user-btn"
            onClick={() => setShowAddForm(true)}
          >
            ➕ Add Account
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-panel-header">
            <h3>🔍 Advanced Filters</h3>
            <div className="filter-actions">
              {getActiveFilterCount() > 0 && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Clear All ({getActiveFilterCount()})
                </button>
              )}
              <button className="close-filters-btn" onClick={() => setShowFilters(false)}>
                ✕
              </button>
            </div>
          </div>
          
          <div className="filter-content">
            {/* Institution Type Filter */}
            <div className="filter-group">
              <label className="filter-label">🏛️ Institution Type</label>
              <div className="filter-options">
                {['bank', 'post_office'].map(institutionType => (
                  <label key={institutionType} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.institutionType === institutionType}
                      onChange={(e) => {
                        const newInstitutionType = e.target.checked ? institutionType : '';
                        setFilters(prev => ({ ...prev, institutionType: newInstitutionType }));
                      }}
                    />
                    <span className="checkbox-text">
                      {institutionType === 'bank' ? '🏦 Bank' : '📮 Post Office'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label className="filter-label">📊 Status</label>
              <div className="filter-options">
                {['active', 'suspended', 'closed'].map(status => (
                  <label key={status} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.status === status}
                      onChange={(e) => {
                        const newStatus = e.target.checked ? status : '';
                        setFilters(prev => ({ ...prev, status: newStatus }));
                      }}
                    />
                    <span className="checkbox-text">
                      {status === 'active' ? '🟢 Active' : status === 'suspended' ? '🟠 Suspended' : '🔴 Closed'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Account Type Filter */}
            <div className="filter-group">
              <label className="filter-label">🏦 Account Type</label>
              <div className="filter-options">
                {filters.institutionType === 'post_office' ? (
                  // Post Office Account Types
                  ['savings_certificate', 'recurring_deposit', 'time_deposit', 'monthly_income_scheme', 'senior_citizen_savings'].map(type => (
                    <label key={type} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.accountType === type}
                        onChange={(e) => {
                          const newType = e.target.checked ? type : '';
                          setFilters(prev => ({ ...prev, accountType: newType }));
                        }}
                      />
                      <span className="checkbox-text">
                        {type === 'savings_certificate' ? 'Savings Certificate' :
                         type === 'recurring_deposit' ? 'Recurring Deposit' :
                         type === 'time_deposit' ? 'Time Deposit' :
                         type === 'monthly_income_scheme' ? 'Monthly Income Scheme' :
                         'Senior Citizen Savings'}
                      </span>
                    </label>
                  ))
                ) : filters.institutionType === 'bank' ? (
                  // Bank Account Types
                  ['savings', 'current', 'fixed', 'recurring', 'business'].map(type => (
                    <label key={type} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.accountType === type}
                        onChange={(e) => {
                          const newType = e.target.checked ? type : '';
                          setFilters(prev => ({ ...prev, accountType: newType }));
                        }}
                      />
                      <span className="checkbox-text">
                        {type === 'savings' ? 'Savings Account' :
                         type === 'current' ? 'Current Account' :
                         type === 'fixed' ? 'Fixed Deposit' :
                         type === 'recurring' ? 'Recurring Deposit' : 'Business Account'}
                      </span>
                    </label>
                  ))
                ) : (
                  // Show all options when no institution type is selected
                  ['savings', 'current', 'fixed', 'recurring', 'business', 'savings_certificate', 'recurring_deposit', 'time_deposit', 'monthly_income_scheme', 'senior_citizen_savings'].map(type => (
                    <label key={type} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.accountType === type}
                        onChange={(e) => {
                          const newType = e.target.checked ? type : '';
                          setFilters(prev => ({ ...prev, accountType: newType }));
                        }}
                      />
                      <span className="checkbox-text">
                        {type === 'savings' ? 'Savings Account' :
                         type === 'current' ? 'Current Account' :
                         type === 'fixed' ? 'Fixed Deposit' :
                         type === 'recurring' ? 'Recurring Deposit' :
                         type === 'business' ? 'Business Account' :
                         type === 'savings_certificate' ? 'Savings Certificate' :
                         type === 'recurring_deposit' ? 'Recurring Deposit' :
                         type === 'time_deposit' ? 'Time Deposit' :
                         type === 'monthly_income_scheme' ? 'Monthly Income Scheme' :
                         'Senior Citizen Savings'}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* KYC Status Filter */}
            <div className="filter-group">
              <label className="filter-label">✅ KYC Status</label>
              <div className="filter-options">
                {['pending', 'verified', 'rejected'].map(kycStatus => (
                  <label key={kycStatus} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.kycStatus === kycStatus}
                      onChange={(e) => {
                        const newKYCStatus = e.target.checked ? kycStatus : '';
                        setFilters(prev => ({ ...prev, kycStatus: newKYCStatus }));
                      }}
                    />
                    <span className="checkbox-text">
                      {kycStatus === 'pending' ? '🟡 Pending' : kycStatus === 'verified' ? '🟢 Verified' : '🔴 Rejected'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Institution Name Filter */}
            <div className="filter-group">
              <label className="filter-label">
                {filters.institutionType === 'post_office' ? '📮 Post Office' : 
                 filters.institutionType === 'bank' ? '🏦 Bank Name' : '🏛️ Institution Name'}
              </label>
              <input
                type="text"
                placeholder={filters.institutionType === 'post_office' ? 'Enter post office name' : 
                           filters.institutionType === 'bank' ? 'Enter bank name' : 'Enter institution name'}
                value={filters.institutionName}
                onChange={(e) => setFilters(prev => ({ ...prev, institutionName: e.target.value }))}
                className="filter-input"
              />
            </div>

            {/* Tenure Range Filter */}
            <div className="filter-group">
              <label className="filter-label">⏰ Tenure Range</label>
              <select
                value={filters.tenureRange}
                onChange={(e) => setFilters(prev => ({ ...prev, tenureRange: e.target.value }))}
                className="filter-select"
              >
                <option value="">All Tenures</option>
                <option value="0-12">0 - 12 months</option>
                <option value="12-24">12 - 24 months</option>
                <option value="24-60">24 - 60 months</option>
                <option value="60-120">60 - 120 months</option>
                <option value="120-">120+ months</option>
              </select>
            </div>
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
      {showEditAccount && selectedAccount && (() => {
        console.log('Opening Edit Account Form with selectedAccount:', selectedAccount);
        
        const initialData = {
          accountNumber: selectedAccount.accountNumber,
          accountOwnershipType: selectedAccount.accountOwnershipType,
          accountHolderNames: selectedAccount.accountHolderNames,
          institutionType: selectedAccount.institutionType,
          accountType: selectedAccount.accountType,
          institutionName: selectedAccount.institutionName,
          branchCode: selectedAccount.branchCode,
          ifscCode: selectedAccount.ifscCode,
          tenure: selectedAccount.tenure,
          status: selectedAccount.status,
          startDate: selectedAccount.openingDate || new Date().toISOString().split('T')[0],
          maturityDate: selectedAccount.openingDate ? 
            new Date(new Date(selectedAccount.openingDate).getTime() + (selectedAccount.tenure * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0],
          paymentType: 'monthly' as const,
          amount: 0,
          lastPaymentDate: selectedAccount.lastTransactionDate || new Date().toISOString().split('T')[0],
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
        };
        
        console.log('Initial data being passed to AccountForm:', initialData);
        console.log('Account holder names:', initialData.accountHolderNames);
        
        return (
          <AccountForm
            isOpen={showEditAccount}
            onClose={() => {
              setShowEditAccount(false);
              // Return to view mode instead of clearing selectedAccount
              setShowViewAccount(true);
            }}
            onSubmit={handleEditAccount}
            mode="edit"
            initialData={initialData}
          />
        );
      })()}

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
                      {selectedAccount.status === 'active' ? '🟢 Active' : 
                       selectedAccount.status === 'suspended' ? '🟠 Suspended' : 
                       selectedAccount.status === 'fined' ? '💰 Fined' : 
                       selectedAccount.status === 'matured' ? '🎯 Matured' : 
                       '🔴 Closed'}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tenure:</span>
                  <span className="detail-value">{selectedAccount.tenure} months</span>
                </div>
              </div>

              <div className="form-section">
                <h4>Account Holder Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Ownership Type:</span>
                  <span className="detail-value">
                    {selectedAccount.accountOwnershipType === 'single' ? 'Single' : 'Joint'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    {selectedAccount.accountOwnershipType === 'single' ? 'Name:' : 'Names:'}
                  </span>
                  <span className="detail-value">
                    {selectedAccount.accountHolderNames.join(', ')}
                  </span>
                </div>


              </div>

              <div className="form-section">
                <h4>Institution Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Institution Type:</span>
                  <span className="detail-value">
                    {selectedAccount.institutionType === 'bank' ? '🏦 Bank' : '📮 Post Office'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Institution Name:</span>
                  <span className="detail-value">{selectedAccount.institutionName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Branch Code:</span>
                  <span className="detail-value">{selectedAccount.branchCode}</span>
                </div>
                {selectedAccount.ifscCode && (
                  <div className="detail-row">
                    <span className="detail-label">IFSC Code:</span>
                    <span className="detail-value">{selectedAccount.ifscCode}</span>
                  </div>
                )}
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
        <div className="users-grid">
          {(currentAccounts.length > 0 ? currentAccounts : accounts).map((account: Account) => (
            <div key={account.id} className="user-card">
              <div className="user-avatar">
                <span className="avatar-initials">
                  {getAccountInitials(account.accountHolderNames[0])}
                </span>
              </div>
              <div className="user-main-info">
                <div className="user-header">
                  <h3 className="full-name">
                    {account.accountOwnershipType === 'single' 
                      ? account.accountHolderNames[0] 
                      : `${account.accountHolderNames[0]} & ${account.accountHolderNames.length - 1} more`}
                  </h3>
                  <span className={`status-badge ${account.status}`}>
                    {account.status === 'active' ? '🟢' : 
                     account.status === 'suspended' ? '🟠' : 
                     account.status === 'fined' ? '💰' : 
                     account.status === 'matured' ? '🎯' : 
                     '🔴'} {getStatusDisplay(account.status)}
                  </span>
                </div>
                <div className="user-details">
                  <div className="detail-row">
                    <span className="detail-label">Account:</span>
                    <span className="detail-value">{account.accountNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{getAccountTypeDisplay(account.accountType)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Institution:</span>
                    <span className="detail-value">
                      {account.institutionType === 'bank' ? '🏦' : '📮'} {account.institutionName}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tenure:</span>
                    <span className="detail-value">{account.tenure} months</span>
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
                <th>Institution</th>
                <th>Tenure</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(currentAccounts.length > 0 ? currentAccounts : accounts).map((account: Account) => (
                <tr key={account.id} className="user-row">
                  <td className="client-info">
                    <div className="client-avatar">
                                          <span className="table-avatar-initials">
                      {getAccountInitials(account.accountHolderNames[0])}
                    </span>
                    </div>
                    <div className="client-name">
                      {account.accountNumber}
                    </div>
                  </td>
                  <td className="address-cell">
                    <div className="cell-content">
                      {account.accountOwnershipType === 'single' 
                        ? account.accountHolderNames[0] 
                        : `${account.accountHolderNames[0]} & ${account.accountHolderNames.length - 1} more`}
                    </div>
                  </td>
                  <td className="mobile-cell">
                    <div className="cell-content">
                      {getAccountTypeDisplay(account.accountType)}
                    </div>
                  </td>
                  <td className="address-cell">
                    <div className="cell-content">
                      {account.institutionType === 'bank' ? '🏦' : '📮'} {account.institutionName}
                    </div>
                  </td>
                  <td className="mobile-cell">
                    <div className="cell-content">
                      {account.tenure} months
                    </div>
                  </td>
                  <td className="status-cell">
                    <span className={`table-status-badge ${account.status || 'active'}`}>
                      {account.status === 'active' ? '🟢' : 
                       account.status === 'suspended' ? '🟠' : 
                       account.status === 'fined' ? '💰' : 
                       account.status === 'matured' ? '🎯' : 
                       '🔴'} {getStatusDisplay(account.status || 'active')}
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