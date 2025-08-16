import React, { useState, useEffect, useCallback } from 'react';
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
  status?: string;
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
    const phones = [
      '9876543210', '8765432109', '7654321098', '6543210987', '9543210876',
      '8432109765', '7321098654', '6210987543', '9109876543', '8098765432'
    ];
    const phone = (user as any).phoneNumbers?.[0]?.number || user.phone || phones[user.id % phones.length];
    return `+91 ${phone}`;
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

  const fetchUsers = useCallback(async (page = currentPage, limit = recordsPerPage, search = searchFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      
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
  }, [currentPage, recordsPerPage, searchFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
        number: 'ABCDE1234F',
        verificationStatus: 'verified' as const,
        verifiedAt: '2024-01-15'
      },
      aadhaarCard: {
        number: 'XXXX-XXXX-1234',
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
          <div className="search-input-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search clients by name..."
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
          </div>
          <button 
            className="add-user-btn"
            onClick={handleAddNewClient}
          >
            <span>➕</span>
            Add New Client
          </button>
        </div>
      </div>

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
                  {user.status === 'active' ? '🟢' : user.status === 'pending' ? '🟡' : user.status === 'suspended' ? '🟠' : '🔴'} 
                  {(user.status || 'active').toUpperCase()}
                </span>
              </div>
              <div className="user-details">
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{getAddressForUser(user)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">KYC:</span>
                  <span className="detail-value">{getKYCForUser(user)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">PAN:</span>
                  <span className="detail-value">{getPANForUser(user)}</span>
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
                <th>KYC</th>
                <th>PAN</th>
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
                  <td className="kyc-cell">
                    <div className="cell-content">
                      {getKYCForUser(user)}
                    </div>
                  </td>
                  <td className="pan-cell">
                    <div className="cell-content">
                      {getPANForUser(user)}
                    </div>
                  </td>
                  <td className="mobile-cell">
                    <div className="cell-content">
                      {getMobileForUser(user)}
                    </div>
                  </td>
                  <td className="status-cell">
                    <span className={`table-status-badge ${user.status || 'active'}`}>
                      {user.status === 'active' ? '🟢' : user.status === 'pending' ? '🟡' : user.status === 'suspended' ? '🟠' : '🔴'} 
                      {(user.status || 'active').toUpperCase()}
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
          accountBalance: editingClient.accountBalance
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
