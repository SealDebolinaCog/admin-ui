import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './UserManagement.css';
import ClientForm from './ClientForm';
import ClientDetailView from './ClientDetailView';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  company?: string;
  status?: 'invite_now' | 'pending' | 'active' | 'suspended' | 'inactive';
  joinDate?: string;
  lastLogin?: string;
  profilePicture?: string;
  accountBalance?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showClientDetail, setShowClientDetail] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', role: 'user' });
  const [searchFilter, setSearchFilter] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Filter and Advanced Search state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    dateCreated: {
      from: '',
      to: ''
    },
    dateModified: {
      from: '',
      to: ''
    }
  });
  const [advancedSearch, setAdvancedSearch] = useState({
    aadhaarNumber: '',
    addressLine1: '',
    panNumber: '',
    emailId: '',
    mobileNumber: ''
  });

  // Applied filters state (what's actually sent to API)
  const [appliedFilters, setAppliedFilters] = useState({
    status: [] as string[],
    dateCreated: { from: '', to: '' },
    dateModified: { from: '', to: '' }
  });
  const [appliedAdvancedSearch, setAppliedAdvancedSearch] = useState({
    aadhaarNumber: '',
    addressLine1: '',
    panNumber: '',
    emailId: '',
    mobileNumber: ''
  });

  // Helper function to count active applied filters
  const getActiveFilterCount = () => {
    let count = 0;
    count += appliedFilters.status.length;
    if (appliedFilters.dateCreated.from || appliedFilters.dateCreated.to) count++;
    if (appliedFilters.dateModified.from || appliedFilters.dateModified.to) count++;
    if (appliedAdvancedSearch.aadhaarNumber) count++;
    if (appliedAdvancedSearch.addressLine1) count++;
    if (appliedAdvancedSearch.panNumber) count++;
    if (appliedAdvancedSearch.emailId) count++;
    if (appliedAdvancedSearch.mobileNumber) count++;
    return count;
  };

  // Helper function to check if there are pending changes
  const hasPendingChanges = () => {
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(appliedFilters);
    const searchChanged = JSON.stringify(advancedSearch) !== JSON.stringify(appliedAdvancedSearch);
    return filtersChanged || searchChanged;
  };

  // Apply filters function
  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    setAppliedAdvancedSearch({ ...advancedSearch });
    setCurrentPage(1); // Reset to first page when applying filters
  };

  // Clear all filters function
  const clearAllFilters = () => {
    const emptyFilters = {
      status: [] as string[],
      dateCreated: { from: '', to: '' },
      dateModified: { from: '', to: '' }
    };
    const emptySearch = {
      aadhaarNumber: '',
      addressLine1: '',
      panNumber: '',
      emailId: '',
      mobileNumber: ''
    };
    
    setFilters(emptyFilters);
    setAdvancedSearch(emptySearch);
    setAppliedFilters(emptyFilters);
    setAppliedAdvancedSearch(emptySearch);
    setCurrentPage(1);
  };
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pagination, setPagination] = useState({
    hasNextPage: false,
    hasPrevPage: false,
    startRecord: 0,
    endRecord: 0
  });

  // Helper function to get user initials from firstName and lastName
  const getUserInitials = (firstName: string, lastName: string): string => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  const getFullName = (firstName: string, lastName: string): string => {
    return `${firstName} ${lastName}`.trim();
  };

  // Helper functions for consistent data display
  const getAddressForUser = (user: User): string => {
    const addresses = [
      '123, MG Road', '456, Park Street', '789, Brigade Road', 
      '321, Commercial Street', '654, Linking Road', '987, Church Street',
      '147, Residency Road', '258, Infantry Road', '369, Richmond Road'
    ];
    return (user as any).address?.addressLine1 || addresses[user.id % addresses.length];
  };

  const getKYCForUser = (user: User): string => {
    return (user as any).kycNumber || `KYC2024${user.id.toString().padStart(6, '0')}`;
  };

  const getPANForUser = (user: User): string => {
    const panNumbers = [
      'ABCDE1234F', 'FGHIJ5678K', 'KLMNO9012P', 'PQRST3456U', 'UVWXY7890Z',
      'BCDEF2345G', 'GHIJK6789L', 'LMNOP0123Q', 'QRSTU4567V', 'VWXYZ8901A'
    ];
    return (user as any).panCard?.number || panNumbers[user.id % panNumbers.length];
  };

  const getMobileForUser = (user: User): string => {
    const mobiles = [
      '7227349632', '9007548029', '8120479482', '9876543210', '8765432109',
      '7654321098', '9543210987', '8432109876', '7321098765', '9210987654'
    ];
    return (user as any).phoneNumbers?.[0]?.number || `+91 ${mobiles[user.id % mobiles.length]}`;
  };

  const getStatusDisplay = (status: string): string => {
    switch (status) {
      case 'invite_now':
        return 'Invite Now';
      case 'pending':
        return 'Pending';
      case 'active':
        return 'Active';
      case 'suspended':
        return 'Suspended';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Active';
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRecordsPerPageChange = (newLimit: number) => {
    setRecordsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSearchChange = (search: string) => {
    setSearchFilter(search);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Filter helper functions
  const updateActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.dateCreated.from || filters.dateCreated.to) count++;
    if (filters.dateModified.from || filters.dateModified.to) count++;
    
    // Count advanced search fields
    if (advancedSearch.aadhaarNumber) count++;
    if (advancedSearch.addressLine1) count++;
    if (advancedSearch.panNumber) count++;
    if (advancedSearch.emailId) count++;
    if (advancedSearch.mobileNumber) count++;
  }, [filters, advancedSearch]);

  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleAdvancedSearchChange = (field: string, value: string) => {
    setAdvancedSearch(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1); // Reset to first page when searching
  };



  const fetchUsers = useCallback(async (page = currentPage, limit = recordsPerPage, search = searchFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && search.length >= 3 && { search })
      });

      // Add filter parameters (use applied filters only)
      if (appliedFilters.status.length > 0) {
        params.append('status', appliedFilters.status.join(','));
      }
      if (appliedFilters.dateCreated.from) {
        params.append('dateCreatedFrom', appliedFilters.dateCreated.from);
      }
      if (appliedFilters.dateCreated.to) {
        params.append('dateCreatedTo', appliedFilters.dateCreated.to);
      }
      if (appliedFilters.dateModified.from) {
        params.append('dateModifiedFrom', appliedFilters.dateModified.from);
      }
      if (appliedFilters.dateModified.to) {
        params.append('dateModifiedTo', appliedFilters.dateModified.to);
      }

      // Add advanced search parameters (use applied search only)
      if (appliedAdvancedSearch.aadhaarNumber) {
        params.append('aadhaarNumber', appliedAdvancedSearch.aadhaarNumber);
      }
      if (appliedAdvancedSearch.addressLine1) {
        params.append('addressLine1', appliedAdvancedSearch.addressLine1);
      }
      if (appliedAdvancedSearch.panNumber) {
        params.append('panNumber', appliedAdvancedSearch.panNumber);
      }
      if (appliedAdvancedSearch.emailId) {
        params.append('emailId', appliedAdvancedSearch.emailId);
      }
      if (appliedAdvancedSearch.mobileNumber) {
        params.append('mobileNumber', appliedAdvancedSearch.mobileNumber);
      }
      
      const response = await axios.get(`/api/users?${params}`);
      if (response.data.success) {
        setUsers(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalRecords(response.data.pagination.totalRecords);
        setPagination({
          hasNextPage: response.data.pagination.hasNextPage,
          hasPrevPage: response.data.pagination.hasPrevPage,
          startRecord: response.data.pagination.startRecord,
          endRecord: response.data.pagination.endRecord
        });
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, recordsPerPage, searchFilter, appliedFilters, appliedAdvancedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Trigger fetchUsers when applied filters change
  useEffect(() => {
    fetchUsers();
  }, [appliedFilters, appliedAdvancedSearch]);

  useEffect(() => {
    updateActiveFiltersCount();
  }, [updateActiveFiltersCount]);

  const handleSuspendClient = async (id: number) => {
    try {
      const response = await axios.patch(`/api/users/${id}`, {
        status: 'suspended'
      });
      if (response.data.success) {
        // Update the user status in the local state
        setUsers(users.map(user => 
          user.id === id ? { ...user, status: 'suspended' } : user
        ));
        alert('Client suspended successfully');
      }
    } catch (error) {
      console.error('Error suspending client:', error);
      alert('Failed to suspend client');
    }
  };

  const deleteUser = async (id: number) => {
    try {
      const response = await axios.delete(`/api/users/${id}`);
      if (response.data.success) {
        setUsers(users.filter(user => user.id !== id));
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/users', newUser);
      if (response.data.success) {
        setUsers([...users, response.data.data]);
        setNewUser({ firstName: '', lastName: '', email: '', role: 'user' });
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user');
    }
  };

  // Client form handlers
  const handleClientSubmit = async (clientData: any) => {
    try {
      if (editingClient) {
        // Update existing client
        const response = await axios.put(`/api/users/${editingClient.id}`, clientData);
        if (response.data.success) {
          await fetchUsers(); // Refresh the list
          setShowClientForm(false);
          setEditingClient(null);
        }
      } else {
        // Add new client
        const response = await axios.post('/api/users', clientData);
        if (response.data.success) {
          await fetchUsers(); // Refresh the list
          setShowClientForm(false);
        }
      }
    } catch (err) {
      console.error('Error saving client:', err);
      setError('Failed to save client');
    }
  };

  const handleEditClient = (client: User) => {
    setEditingClient(client);
    setShowClientForm(true);
  };

  const handleAddNewClient = () => {
    setEditingClient(null);
    setShowClientForm(true);
  };

  const handleViewClient = (client: User) => {
    // Convert User to ClientDetailData format
    const clientDetailData = {
      id: client.id,
      clientId: `CLI-2024-${client.id.toString().padStart(6, '0')}`,
      firstName: client.firstName,
      middleName: undefined,
      lastName: client.lastName,
      address: {
        addressLine1: '123, MG Road',
        addressLine2: 'Near Temple',
        addressLine3: undefined,
        state: 'Maharashtra',
        district: 'Mumbai',
        pincode: '400001',
        country: 'India'
      },
      kycNumber: `KYC2024${client.id.toString().padStart(6, '0')}`,
      email: client.email,
      phoneNumbers: [{
        id: 'phone-1',
        countryCode: '+91',
        number: client.phone || '9876543210',
        type: 'primary' as const,
        isVerified: true
      }],
      panCard: {
        number: `ABCDE${client.id.toString().padStart(4, '0')}F`,
        verificationStatus: 'verified' as const,
        verifiedAt: '2024-01-15'
      },
      aadhaarCard: {
        number: `${(client.id * 123456789).toString().padStart(12, '0').slice(0, 12)}`,
        verificationStatus: 'verified' as const,
        verifiedAt: '2024-01-15'
      },
      otherDocuments: [],
      linkedClients: [],
      status: client.status === 'active' ? 'active' as const : 'pending' as const,
      accountBalance: client.accountBalance,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      addedAt: '2024-01-01T00:00:00Z',
      lastModifiedAt: '2024-12-01T00:00:00Z',
      profilePicture: client.profilePicture,
      joinDate: client.joinDate,
      lastLogin: client.lastLogin
    };
    
    setSelectedClient(clientDetailData as any);
    setShowClientDetail(true);
  };

  const handleCloseClientDetail = () => {
    setShowClientDetail(false);
    setSelectedClient(null);
  };

  const handleEditFromDetail = () => {
    if (selectedClient) {
      // Convert back to User format for editing
      const userForEdit: User = {
        id: selectedClient.id,
        firstName: selectedClient.firstName,
        lastName: selectedClient.lastName,
        email: selectedClient.email || '',
        role: 'client',
        phone: (selectedClient as any).phoneNumbers?.[0]?.number,
        company: (selectedClient as any).address?.district + ' Branch',
        status: selectedClient.status === 'active' ? 'active' : 'pending',
        joinDate: selectedClient.joinDate,
        lastLogin: selectedClient.lastLogin,
        accountBalance: selectedClient.accountBalance,
        profilePicture: selectedClient.profilePicture
      };
      
      setEditingClient(userForEdit);
      setShowClientDetail(false);
      setShowClientForm(true);
    }
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management">
        <div className="error-state">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button
            onClick={() => fetchUsers()}
            className="retry-btn"
          >🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // No client-side filtering needed - handled by server-side pagination

  return (
    <div className="user-management">
      <div className="user-header">
        <div>
          <h1>Clients</h1>
          <p>Manage clients and their accounts</p>
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
                fetchUsers(1, recordsPerPage, searchFilter);
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
              placeholder="Search clients by name (min 3 letters)..."
              value={searchFilter}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
            {searchFilter && (
              <button
                onClick={() => handleSearchChange('')}
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
            🔧 Filters {getActiveFilterCount() > 0 && <span className="filter-count">{getActiveFilterCount()}</span>}
          </button>
          <button 
            className="add-user-btn"
            onClick={handleAddNewClient}
          >
            <span>➕</span>
            Add New Client
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-panel-header">
            <h3>🔍 Advanced Filters</h3>
            <div className="filter-actions">
              {getActiveFilterCount() > 0 && (
                <button className="clear-filters-btn" onClick={clearAllFilters}>
                  Clear All ({getActiveFilterCount()})
                </button>
              )}
              <button className="close-filters-btn" onClick={() => setShowFilters(false)}>
                ✕
              </button>
            </div>
          </div>
          
          <div className="filter-content">
            {/* Status Filter */}
            <div className="filter-group">
              <label className="filter-label">📊 Status</label>
              <div className="filter-options">
                {['invite_now', 'pending', 'active', 'suspended'].map(status => (
                  <label key={status} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={(e) => {
                        const newStatus = e.target.checked
                          ? [...filters.status, status]
                          : filters.status.filter((s: string) => s !== status);
                        handleFilterChange('status', newStatus);
                      }}
                    />
                    <span className="checkbox-text">
                      {status === 'invite_now' ? '🔴 Invite Now' : 
                       status === 'pending' ? '🟡 Pending' : 
                       status === 'active' ? '🟢 Active' : '🟠 Suspended'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Created Filter */}
            <div className="filter-group">
              <label className="filter-label">📅 Date Created</label>
              <div className="date-range-inputs">
                <div className="date-input-group">
                  <label>From:</label>
                  <input
                    type="date"
                    value={filters.dateCreated.from}
                    onChange={(e) => handleFilterChange('dateCreated', {
                      ...filters.dateCreated,
                      from: e.target.value
                    })}
                    className="date-input"
                  />
                </div>
                <div className="date-input-group">
                  <label>To:</label>
                  <input
                    type="date"
                    value={filters.dateCreated.to}
                    onChange={(e) => handleFilterChange('dateCreated', {
                      ...filters.dateCreated,
                      to: e.target.value
                    })}
                    className="date-input"
                  />
                </div>
              </div>
            </div>

            {/* Date Modified Filter */}
            <div className="filter-group">
              <label className="filter-label">📝 Date Last Modified</label>
              <div className="date-range-inputs">
                <div className="date-input-group">
                  <label>From:</label>
                  <input
                    type="date"
                    value={filters.dateModified.from}
                    onChange={(e) => handleFilterChange('dateModified', {
                      ...filters.dateModified,
                      from: e.target.value
                    })}
                    className="date-input"
                  />
                </div>
                <div className="date-input-group">
                  <label>To:</label>
                  <input
                    type="date"
                    value={filters.dateModified.to}
                    onChange={(e) => handleFilterChange('dateModified', {
                      ...filters.dateModified,
                      to: e.target.value
                    })}
                    className="date-input"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Search Fields */}
            <div className="filter-group advanced-search-section">
              <label className="filter-label">🔍 Advanced Search</label>
              
              <div className="advanced-search-grid">
                <div className="search-field">
                  <label>Aadhaar Number:</label>
                  <input
                    type="text"
                    placeholder="Enter Aadhaar number..."
                    value={advancedSearch.aadhaarNumber}
                    onChange={(e) => handleAdvancedSearchChange('aadhaarNumber', e.target.value)}
                    className="advanced-search-input"
                  />
                </div>

                <div className="search-field">
                  <label>Address Line 1:</label>
                  <input
                    type="text"
                    placeholder="Enter first line of address..."
                    value={advancedSearch.addressLine1}
                    onChange={(e) => handleAdvancedSearchChange('addressLine1', e.target.value)}
                    className="advanced-search-input"
                  />
                </div>

                <div className="search-field">
                  <label>PAN Number:</label>
                  <input
                    type="text"
                    placeholder="Enter PAN number..."
                    value={advancedSearch.panNumber}
                    onChange={(e) => handleAdvancedSearchChange('panNumber', e.target.value)}
                    className="advanced-search-input"
                  />
                </div>

                <div className="search-field">
                  <label>Email ID:</label>
                  <input
                    type="email"
                    placeholder="Enter email address..."
                    value={advancedSearch.emailId}
                    onChange={(e) => handleAdvancedSearchChange('emailId', e.target.value)}
                    className="advanced-search-input"
                  />
                </div>

                <div className="search-field">
                  <label>Mobile Number:</label>
                  <input
                    type="text"
                    placeholder="Enter mobile number..."
                    value={advancedSearch.mobileNumber}
                    onChange={(e) => handleAdvancedSearchChange('mobileNumber', e.target.value)}
                    className="advanced-search-input"
                  />
                </div>
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="filter-actions-bottom">
              <button 
                className={`apply-filters-btn ${hasPendingChanges() ? 'has-changes' : ''}`}
                onClick={applyFilters}
                disabled={!hasPendingChanges()}
              >
                🔍 Apply Filters & Search
              </button>
              <button 
                className="clear-all-btn"
                onClick={clearAllFilters}
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="add-user-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New User</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={addUser} className="add-user-form">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'cards' ? (
        <div className="users-grid">
        {users.map((user: User) => (
          <div key={user.id} className="user-card">
            <div className="user-avatar">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={getFullName(user.firstName, user.lastName)}
                  className="avatar-image"
                />
              ) : (
                <span className="avatar-initials">
                  {getUserInitials(user.firstName, user.lastName)}
                </span>
              )}
            </div>
            <div className="user-main-info">
              <div className="user-header">
                <h3 className="full-name">{getFullName(user.firstName, user.lastName)}</h3>
                <span className={`status-badge ${user.status || 'active'}`}>
                  {user.status === 'active' ? '🟢' : user.status === 'pending' ? '🟡' : user.status === 'suspended' ? '🟠' : '🔴'} {getStatusDisplay(user.status || 'active')}
                </span>
              </div>
              <div className="user-details">
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{getAddressForUser(user)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Mobile:</span>
                  <span className="detail-value">{getMobileForUser(user)}</span>
                </div>
              </div>
            </div>
            <div className="user-actions">
              <button 
                className="action-btn view-btn"
                onClick={() => handleViewClient(user)}
                title="View client details"
              >
                👁️
              </button>
              <button 
                className="action-btn edit-btn"
                onClick={() => handleEditClient(user)}
                title="Edit client"
              >
                ✏️
              </button>
              <button 
                className="action-btn suspend-btn"
                onClick={() => handleSuspendClient(user.id)}
                title="Suspend client"
              >
                ⏸️
              </button>
              <button 
                className="action-btn delete-btn"
                onClick={() => deleteUser(user.id)}
                title="Delete client"
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
                <th>Client</th>
                <th>Address</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: User) => (
                <tr key={user.id} className="user-row">
                  <td className="client-info">
                    <div className="client-avatar">
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={getFullName(user.firstName, user.lastName)}
                          className="table-avatar-image"
                        />
                      ) : (
                        <span className="table-avatar-initials">
                          {getUserInitials(user.firstName, user.lastName)}
                        </span>
                      )}
                    </div>
                    <div className="client-name">
                      {getFullName(user.firstName, user.lastName)}
                    </div>
                  </td>
                  <td className="address-cell">
                    <div className="cell-content">
                      {getAddressForUser(user)}
                    </div>
                  </td>
                  <td className="mobile-cell">
                    <div className="cell-content">
                      {getMobileForUser(user)}
                    </div>
                  </td>
                  <td className="status-cell">
                    <span className={`table-status-badge ${user.status || 'active'}`}>
                      {user.status === 'active' ? '🟢' : user.status === 'pending' ? '🟡' : user.status === 'suspended' ? '🟠' : '🔴'} {getStatusDisplay(user.status || 'active')}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="table-actions">
                      <button 
                        className="table-action-btn view-btn"
                        onClick={() => handleViewClient(user)}
                        title="View client details"
                      >
                        👁️
                      </button>
                      <button 
                        className="table-action-btn edit-btn"
                        onClick={() => handleEditClient(user)}
                        title="Edit client"
                      >
                        ✏️
                      </button>
                      <button 
                        className="table-action-btn suspend-btn"
                        onClick={() => handleSuspendClient(user.id)}
                        title="Suspend client"
                      >
                        ⏸️
                      </button>
                      <button 
                        className="table-action-btn delete-btn"
                        onClick={() => deleteUser(user.id)}
                        title="Delete client"
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

      {/* Enhanced Pagination Controls */}
      {totalRecords > 0 && (
        <div className="pagination-wrapper">
          <div className="pagination-container">
            {/* Pagination Info Section */}
            <div className="pagination-info-section">
              <div className="pagination-summary">
                <span className="summary-text">
                  <strong>{pagination.startRecord}-{pagination.endRecord}</strong> of <strong>{totalRecords.toLocaleString()}</strong> clients
                </span>
                <div className="page-indicator">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </div>
              </div>
              
              <div className="records-per-page-section">
                <label htmlFor="recordsPerPage" className="records-label">
                  <span className="label-icon">📄</span>
                  Show:
                </label>
                <select
                  id="recordsPerPage"
                  value={recordsPerPage}
                  onChange={(e) => handleRecordsPerPageChange(Number(e.target.value))}
                  className="records-select"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>
            
            {/* Navigation Controls */}
            <div className="pagination-navigation">
              <div className="nav-group">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={!pagination.hasPrevPage}
                  className={`nav-btn first-btn ${!pagination.hasPrevPage ? 'disabled' : ''}`}
                  title="First page"
                >
                  <span className="btn-icon">⏮</span>
                  <span className="btn-text">First</span>
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`nav-btn prev-btn ${!pagination.hasPrevPage ? 'disabled' : ''}`}
                  title="Previous page"
                >
                  <span className="btn-icon">←</span>
                  <span className="btn-text">Previous</span>
                </button>
              </div>
              
              <div className="page-numbers-section">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`page-number-btn ${currentPage === pageNum ? 'active' : ''}`}
                      title={`Go to page ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 7 && currentPage < totalPages - 3 && (
                  <>
                    <span className="page-ellipsis">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="page-number-btn"
                      title={`Go to page ${totalPages}`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <div className="nav-group">
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`nav-btn next-btn ${!pagination.hasNextPage ? 'disabled' : ''}`}
                  title="Next page"
                >
                  <span className="btn-text">Next</span>
                  <span className="btn-icon">→</span>
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={!pagination.hasNextPage}
                  className={`nav-btn last-btn ${!pagination.hasNextPage ? 'disabled' : ''}`}
                  title="Last page"
                >
                  <span className="btn-text">Last</span>
                  <span className="btn-icon">⏭</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {users.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No clients found</h3>
          {searchFilter ? (
            <p>No clients match your search criteria</p>
          ) : (
            <p>Get started by adding your first client</p>
          )}
          <button 
            className="add-first-user-btn"
            onClick={handleAddNewClient}
          >
            Add First Client
          </button>
        </div>
      )}

      {/* Comprehensive Client Form */}
      <ClientForm
        isOpen={showClientForm}
        onClose={() => {
          setShowClientForm(false);
          setEditingClient(null);
        }}
        onSubmit={handleClientSubmit}
        initialData={editingClient ? {
          firstName: editingClient.firstName,
          lastName: editingClient.lastName,
          email: editingClient.email,
          status: editingClient.status as any || 'active',
          accountBalance: editingClient.accountBalance,
          kycNumber: `KYC${new Date().getFullYear()}${editingClient.id.toString().padStart(6, '0')}`,
          address: {
            addressLine1: `${editingClient.id} Main Street`,
            addressLine2: editingClient.company || 'Business District',
            addressLine3: '',
            state: 'West Bengal',
            district: 'Nadia',
            pincode: '741501',
            country: 'India'
          },
          phoneNumbers: editingClient.phone ? [{
            id: 'phone-1',
            countryCode: '+91',
            number: editingClient.phone.replace(/^\+91\s*/, ''),
            type: 'primary' as const,
            isVerified: false
          }] : [],
          panCard: {
            number: `ABCDE${editingClient.id.toString().padStart(4, '0')}F`,
            imageUrl: undefined,
            verificationStatus: 'pending' as const,
            verifiedAt: undefined
          },
          aadhaarCard: {
            number: `${(editingClient.id * 123456789).toString().padStart(12, '0').slice(0, 12)}`,
            imageUrl: undefined,
            verificationStatus: 'pending' as const,
            verifiedAt: undefined
          }
        } : undefined}
        mode={editingClient ? 'edit' : 'add'}
      />

      {/* Client Detail View */}
      {selectedClient && (
        <ClientDetailView
          client={selectedClient as any}
          isOpen={showClientDetail}
          onClose={handleCloseClientDetail}
          onEdit={handleEditFromDetail}
        />
      )}
    </div>
  );
};

export default UserManagement;
