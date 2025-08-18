import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './UserManagement.css';
import ClientForm from './ClientForm';
import SimpleClientDetailView from './SimpleClientDetailView';

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  kycNumber?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  state?: string;
  district?: string;
  pincode?: string;
  country?: string;
  status: 'invite_now' | 'pending' | 'active' | 'suspended' | 'deleted';
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showClientDetail, setShowClientDetail] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingClientFormData, setEditingClientFormData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [searchFilter, setSearchFilter] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Filter and Advanced Search state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    state: '',
    district: ''
  });
  const [advancedSearch, setAdvancedSearch] = useState({
    addressLine1: '',
    state: '',
    district: '',
    pincode: ''
  });

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState({
    status: [] as string[],
    state: '',
    district: ''
  });
  const [appliedAdvancedSearch, setAppliedAdvancedSearch] = useState({
    addressLine1: '',
    state: '',
    district: '',
    pincode: ''
  });

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
  const getAddressForUser = (client: Client): string => {
    if (client.addressLine1) {
      return client.addressLine1;
    }
    return 'Address not provided';
  };

  const getStatusDisplay = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'suspended':
        return 'Suspended';
      case 'closed':
        return 'Closed';
      case 'deleted':
        return 'Deleted';
      case 'pending':
        return 'Pending';
      case 'invite_now':
        return 'Invite Now';
      default:
        return 'Active';
    }
  };

  // Map database status to form status
  const mapStatusForForm = (status: string): 'invite_now' | 'pending' | 'active' | 'suspended' | 'deleted' => {
    switch (status) {
      case 'closed':
        return 'deleted';
      case 'active':
      case 'suspended':
      case 'deleted':
      case 'pending':
      case 'invite_now':
        return status as any;
      default:
        return 'active';
    }
  };

  // Map form status to backend status
  const mapStatusForBackend = (status: string): 'invite_now' | 'pending' | 'active' | 'suspended' | 'deleted' => {
    switch (status) {
      case 'invite_now':
        return 'invite_now';
      case 'pending':
        return 'pending';
      case 'active':
        return 'active';
      case 'suspended':
        return 'suspended';
      case 'deleted':
        return 'deleted';
      default:
        return 'active';
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRecordsPerPageChange = (newLimit: number) => {
    setRecordsPerPage(newLimit);
    setCurrentPage(1);
  };

  // Fetch clients from database
  const fetchClients = useCallback(async (page = currentPage, limit = recordsPerPage, search = searchFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add search parameter
      if (search && search.length >= 3) {
        params.append('search', search);
      }

      // Add status filter
      if (appliedFilters.status.length > 0) {
        params.append('status', appliedFilters.status[0]);
      }

      // Add state filter
      if (appliedFilters.state) {
        params.append('state', appliedFilters.state);
      }

      // Add district filter
      if (appliedFilters.district) {
        params.append('district', appliedFilters.district);
      }
      
      const response = await axios.get(`/api/clients?${params}`);
      if (response.data.success) {
        setClients(response.data.data);
        setTotalRecords(response.data.count || response.data.data.length);
        setTotalPages(Math.ceil((response.data.count || response.data.data.length) / recordsPerPage));
        
        // Calculate pagination info
        const startRecord = (page - 1) * limit + 1;
        const endRecord = Math.min(page * limit, response.data.count || response.data.data.length);
        setPagination({
          hasNextPage: page < Math.ceil((response.data.count || response.data.data.length) / limit),
          hasPrevPage: page > 1,
          startRecord,
          endRecord
        });
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, [currentPage, recordsPerPage, searchFilter, appliedFilters]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Trigger fetchClients when applied filters change
  useEffect(() => {
    fetchClients();
  }, [appliedFilters]);

  const handleSuspendClient = async (id: number) => {
    try {
      const response = await axios.put(`/api/clients/${id}`, {
        status: 'suspended'
      });
      if (response.data.success) {
        // Update the client status in the local state
        setClients(clients.map(client => 
          client.id === id ? { ...client, status: 'suspended' } : client
        ));
        alert('Client suspended successfully');
      }
    } catch (error) {
      console.error('Error suspending client:', error);
      alert('Failed to suspend client');
    }
  };

  const deleteClient = async (id: number) => {
    try {
      const response = await axios.delete(`/api/clients/${id}`);
      if (response.data.success) {
        setClients(clients.filter(client => client.id !== id));
        alert('Client deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client');
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/clients', newClient);
      if (response.data.success) {
        setClients([...clients, response.data.data]);
        setNewClient({ firstName: '', lastName: '', email: '', phone: '' });
        setShowAddForm(false);
        alert('Client added successfully');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client');
    }
  };

  const handleClientFormSubmit = async (clientData: any) => {
    try {
      if (editingClient) {
        // Update existing client - map form data to backend structure
        const updateData = {
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          email: clientData.email || null,
          phone: clientData.phoneNumbers?.[0]?.number || null,
          kycNumber: clientData.kycNumber || null,
          panNumber: clientData.panCard?.number || null,
          aadhaarNumber: clientData.aadhaarCard?.number || null,
          addressLine1: clientData.address?.addressLine1 || null,
          addressLine2: clientData.address?.addressLine2 || null,
          addressLine3: clientData.address?.addressLine3 || null,
          state: clientData.address?.state || null,
          district: clientData.address?.district || null,
          pincode: clientData.address?.pincode || null,
          country: clientData.address?.country || 'India',
          status: mapStatusForBackend(clientData.status) || 'active'
        };

        console.log('Updating client with data:', updateData);
        
        const response = await axios.put(`/api/clients/${editingClient.id}`, updateData);
        if (response.data.success) {
          await fetchClients(); // Refresh the list
          setEditingClient(null);
          setEditingClientFormData(null);
          setShowClientForm(false);
          alert('Client updated successfully');
        } else {
          throw new Error(response.data.error || 'Failed to update client');
        }
      } else {
        // Add new client - map form data to backend structure
        const newClientData = {
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          email: clientData.email || null,
          phone: clientData.phoneNumbers?.[0]?.number || null,
          kycNumber: clientData.kycNumber || null,
          panNumber: clientData.panCard?.number || null,
          aadhaarNumber: clientData.aadhaarCard?.number || null,
          addressLine1: clientData.address?.addressLine1 || null,
          addressLine2: clientData.address?.addressLine2 || null,
          addressLine3: clientData.address?.addressLine3 || null,
          state: clientData.address?.state || null,
          district: clientData.address?.district || null,
          pincode: clientData.address?.pincode || null,
          country: clientData.address?.country || 'India',
          status: mapStatusForBackend(clientData.status) || 'active'
        };

        console.log('Creating new client with data:', newClientData);
        
        const response = await axios.post('/api/clients', newClientData);
        if (response.data.success) {
          await fetchClients(); // Refresh the list
          setShowClientForm(false);
          alert('Client added successfully');
        } else {
          throw new Error(response.data.error || 'Failed to add client');
        }
      }
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client');
    }
  };

  const handleEditClient = (client: Client) => {
    // Map the client data to match what ClientForm expects
    const mappedClient = {
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email || '',
      kycNumber: client.kycNumber || '',
      phoneNumbers: client.phone ? [{
        id: 'phone-1',
        countryCode: '+91',
        number: client.phone,
        type: 'primary' as const,
        isVerified: false
      }] : [],
      address: {
        addressLine1: client.addressLine1 || '',
        addressLine2: client.addressLine2 || '',
        addressLine3: client.addressLine3 || '',
        state: client.state || 'West Bengal',
        district: client.district || 'Kolkata',
        pincode: client.pincode || '',
        country: client.country || 'India'
      },
      panCard: client.panNumber ? {
        number: client.panNumber,
        verificationStatus: 'pending' as const
      } : undefined,
      aadhaarCard: client.aadhaarNumber ? {
        number: client.aadhaarNumber,
        verificationStatus: 'pending' as const
      } : undefined,
      status: mapStatusForForm(client.status)
    };
    setEditingClient(client);
    setEditingClientFormData(mappedClient);
    setShowClientForm(true);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientDetail(true);
  };

  const handleCloseForms = () => {
    setShowAddForm(false);
    setShowClientForm(false);
    setShowClientDetail(false);
    setEditingClient(null);
    setEditingClientFormData(null);
    setSelectedClient(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchFilter.trim()) {
      fetchClients(1, recordsPerPage, searchFilter);
    }
  };

  const clearSearch = () => {
    setSearchFilter('');
    fetchClients(1, recordsPerPage, '');
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
      state: '',
      district: ''
    };
    const emptySearch = {
      addressLine1: '',
      state: '',
      district: '',
      pincode: ''
    };
    
    setFilters(emptyFilters);
    setAdvancedSearch(emptySearch);
    setAppliedFilters(emptyFilters);
    setAppliedAdvancedSearch(emptySearch);
    setCurrentPage(1);
  };

  // Helper function to count active applied filters
  const getActiveFilterCount = () => {
    let count = 0;
    count += appliedFilters.status.length;
    if (appliedFilters.state) count++;
    if (appliedFilters.district) count++;
    if (appliedAdvancedSearch.addressLine1) count++;
    if (appliedAdvancedSearch.state) count++;
    if (appliedAdvancedSearch.district) count++;
    if (appliedAdvancedSearch.pincode) count++;
    return count;
  };

  if (loading && clients.length === 0) {
    return (
      <div className="users-management">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="users-management">
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={() => fetchClients()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="users-management">
      {/* Header */}
      <div className="users-header">
        <div>
          <h1>Clients</h1>
          <p>Manage clients and their information</p>
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
                fetchClients(1, recordsPerPage, searchFilter);
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
            onClick={() => setShowClientForm(true)}
          >
            ➕ Add Client
          </button>
        </div>
      </div>



      {/* Filter Panel */}
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
                {['active', 'suspended', 'closed'].map(status => (
                  <label key={status} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={(e) => {
                        const newStatus = e.target.checked
                          ? [...filters.status, status]
                          : filters.status.filter((s: string) => s !== status);
                        setFilters(prev => ({ ...prev, status: newStatus }));
                      }}
                    />
                    <span className="checkbox-text">
                      {status === 'active' ? '🟢 Active' : 
                       status === 'suspended' ? '🟠 Suspended' : '⚫ Closed'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* State Filter */}
            <div className="filter-group">
              <label className="filter-label">🏛️ State</label>
              <input
                type="text"
                placeholder="Enter state"
                value={filters.state}
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                className="filter-input"
              />
            </div>

            {/* District Filter */}
            <div className="filter-group">
              <label className="filter-label">🏘️ District</label>
              <input
                type="text"
                placeholder="Enter district"
                value={filters.district}
                onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
                className="filter-input"
              />
            </div>

            {/* Filter Action Buttons */}
            <div className="filter-actions-bottom">
              <button 
                className="apply-filters-btn"
                onClick={applyFilters}
              >
                🔍 Apply Filters
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

      {/* Content */}
      {clients.length === 0 ? (
        <div className="empty-state">
          <p>No clients found. Add your first client to get started!</p>
          <button onClick={() => setShowClientForm(true)} className="add-first-client-btn">
            ➕ Add First Client
          </button>
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="users-grid">
              {clients.map(client => (
                <div key={client.id} className="user-card">
                  <div className="user-card-header">
                    <div className="user-avatar">
                      {getUserInitials(client.firstName, client.lastName)}
                    </div>
                    <div className="user-main-info">
                      <h3>{getFullName(client.firstName, client.lastName)}</h3>
                      <span className={`status-badge ${client.status}`}>
                        {getStatusDisplay(client.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="user-card-details">
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{client.email || 'Not provided'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{client.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{getAddressForUser(client)}</span>
                    </div>
                  </div>
                  
                  <div className="user-card-actions">
                    <button onClick={() => handleViewClient(client)} className="view-btn">
                      👁️ View
                    </button>
                    <button onClick={() => handleEditClient(client)} className="edit-btn">
                      ✏️ Edit
                    </button>
                    {client.status === 'active' && (
                      <button onClick={() => handleSuspendClient(client.id)} className="suspend-btn">
                        ⏸️ Suspend
                      </button>
                    )}
                    <button onClick={() => deleteClient(client.id)} className="delete-btn">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr key={client.id}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar-small">
                            {getUserInitials(client.firstName, client.lastName)}
                          </div>
                          <span>{getFullName(client.firstName, client.lastName)}</span>
                        </div>
                      </td>
                      <td>{client.email || 'Not provided'}</td>
                      <td>{client.phone || 'Not provided'}</td>
                      <td>{getAddressForUser(client)}</td>
                      <td>
                        <span className={`table-status-badge ${client.status}`}>
                          {getStatusDisplay(client.status)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => handleViewClient(client)} className="view-btn">
                            👁️
                          </button>
                          <button onClick={() => handleEditClient(client)} className="edit-btn">
                            ✏️
                          </button>
                          {client.status === 'active' && (
                            <button onClick={() => handleSuspendClient(client.id)} className="suspend-btn">
                              ⏸️
                            </button>
                          )}
                          <button onClick={() => deleteClient(client.id)} className="delete-btn">
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
                Showing {pagination.startRecord} to {pagination.endRecord} of {totalRecords} clients
              </div>
              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Forms and Modals */}
      {showClientForm && (
        <ClientForm
          isOpen={showClientForm}
          onClose={handleCloseForms}
          onSubmit={handleClientFormSubmit}
          initialData={editingClientFormData || undefined}
          mode={editingClient ? 'edit' : 'add'}
        />
      )}

      {showClientDetail && selectedClient && (
        <SimpleClientDetailView
          client={selectedClient}
          onClose={handleCloseForms}
          onEdit={() => {
            setEditingClient(selectedClient);
            setShowClientDetail(false);
            setShowClientForm(true);
          }}
        />
      )}
    </div>
  );
};

export default ClientManagement; 