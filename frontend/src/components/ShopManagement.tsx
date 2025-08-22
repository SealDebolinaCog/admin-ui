import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './UserManagement.css'; // Reuse the same CSS for consistent styling
import ShopForm from './ShopForm';
import ShopClientManager from './ShopClientManager';
import { useMessageHandler } from '../hooks/useMessageHandler';
import SuccessMessage from './common/SuccessMessage';

interface Shop {
  id: number;
  shopName: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  state?: string;
  district?: string;
  pincode?: string;
  country?: string;
  category: string;
  shopType?: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

const ShopManagement: React.FC = () => {
  // State management
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, successMessage, setError, setSuccessMessage, clearAllMessages, clearSuccessMessage } = useMessageHandler();
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [currentStep, setCurrentStep] = useState(1);
  const [shopFormData, setShopFormData] = useState({
    shopName: '',
    ownerName: '',
    category: 'retail',
    address: {
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      state: 'West Bengal',
      district: 'Kolkata',
      pincode: '',
      country: 'India'
    },
    email: '',
    phone: ''
  });
  const [shopFormErrors, setShopFormErrors] = useState<{[key: string]: string}>({});
  const [searchFilter, setSearchFilter] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // New state variables for shop actions
  const [showViewShop, setShowViewShop] = useState(false);
  const [showEditShop, setShowEditShop] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  
  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);
  
  // Status change confirmation modal state
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState<{
    shop: Shop;
    newStatus: 'active' | 'pending' | 'suspended' | 'inactive';
    action: string;
  } | null>(null);
  
  // Shop Client Manager state
  const [showShopClientManager, setShowShopClientManager] = useState(false);
  const [selectedShopForClients, setSelectedShopForClients] = useState<Shop | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    category: [] as string[],
    shopType: [] as string[]
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  // Add states and districts data (same as ClientForm)
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  const westBengalDistricts = [
    'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur',
    'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong',
    'Kolkata', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas',
    'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman',
    'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur'
  ];

  // API base URL
  const API_BASE_URL = '/api/shops';

  // Search and filter functions
  const handleSearchChange = (search: string) => {
    setSearchFilter(search);
    setCurrentPage(1);
  };

  const fetchShops = useCallback(async (page = currentPage, limit = recordsPerPage, search = searchFilter) => {
    try {
      setLoading(true);
      
      // Build query parameters for the API
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (search && search.length >= 3) params.append('search', search);
      
      // Add filters
      if (appliedFilters.status.length > 0) {
        appliedFilters.status.forEach(status => params.append('status', status));
      }
      if (appliedFilters.category.length > 0) {
        appliedFilters.category.forEach(category => params.append('category', category));
      }
      if (appliedFilters.shopType.length > 0) {
        appliedFilters.shopType.forEach(shopType => params.append('shopType', shopType));
      }

      // Make API call
      const response = await axios.get(`${API_BASE_URL}?${params.toString()}`);
      
      if (response.data.success) {
        const shopsData = response.data.data;
        setShops(shopsData);
        setTotalRecords(response.data.count || shopsData.length);
        setTotalPages(Math.ceil((response.data.count || shopsData.length) / limit));
        setError(null);
      } else {
        setError('Failed to fetch shops');
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      setError('Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  }, [currentPage, recordsPerPage, searchFilter, appliedFilters]);

  // Load shops on component mount
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Helper functions
  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': 'Active',
      'pending': 'Pending',
      'suspended': 'Suspended',
      'inactive': 'Inactive'
    };
    return statusMap[status] || status;
  };

  const getCategoryDisplay = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'electronics': 'Electronics',
      'clothing': 'Clothing & Fashion',
      'food': 'Food & Beverages',
      'healthcare': 'Healthcare',
      'automotive': 'Automotive',
      'beauty': 'Beauty & Personal Care',
      'home': 'Home & Garden',
      'sports': 'Sports & Outdoors',
      'books': 'Books & Stationery',
      'jewelry': 'Jewelry & Accessories',
      'pharmaceuticals': 'Pharmaceuticals',
      'hardware': 'Hardware & Tools',
      'furniture': 'Furniture',
      'other': 'Other'
    };
    return categoryMap[category] || category;
  };

  const getShopInitials = (shopName: string) => {
    return shopName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Form handlers
  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleAddShop = async (shopData: any) => {
    try {
      // Map the complex form data to the backend API structure
      const newShopData = {
        shopName: shopData.shopName,
        ownerName: shopData.ownerName,
        ownerEmail: shopData.ownerEmail,
        ownerPhone: shopData.ownerPhone,
        addressLine1: shopData.address.addressLine1,
        addressLine2: shopData.address.addressLine2,
        addressLine3: shopData.address.addressLine3,
        state: shopData.address.state,
        district: shopData.address.district,
        pincode: shopData.address.pincode,
        country: shopData.address.country,
        category: shopData.category,
        shopType: shopData.shopType,
        status: shopData.status || 'pending'
      };

      // Send POST request to create new shop in the backend
      const response = await axios.post(API_BASE_URL, newShopData);
      
      if (response.data.success) {
        // Reset form
        setShopFormData({
          shopName: '',
          ownerName: '',
          category: 'retail',
          address: {
            addressLine1: '',
            addressLine2: '',
            addressLine3: '',
            state: 'West Bengal',
            district: 'Kolkata',
            pincode: '',
            country: 'India'
          },
          email: '',
          phone: ''
        });
        setShopFormErrors({});
        setCurrentStep(1);
        setShowAddForm(false);
        setError(null);
        setSuccessMessage('Shop created successfully!');
        
        // Refresh the shops data to show the latest changes
        await fetchShops();
        
        console.log('Shop created successfully');
      } else {
        throw new Error(response.data.error || 'Failed to create shop');
      }
    } catch (error) {
      console.error('Error creating shop:', error);
      alert('Failed to create shop. Please try again.');
    }
  };

  const deleteShop = async (shopId: number) => {
    const shop = shops.find(s => s.id === shopId);
    if (shop) {
      setShopToDelete(shop);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (shopToDelete) {
      try {
        // Send DELETE request to remove shop from the backend
        const response = await axios.delete(`${API_BASE_URL}/${shopToDelete.id!}`);
        
        if (response.data.success) {
          // Refresh the shops data to show the latest changes
          await fetchShops();
          setSuccessMessage('Shop deleted successfully!');
          console.log('Shop deleted successfully');
        } else {
          throw new Error(response.data.error || 'Failed to delete shop');
        }
      } catch (error) {
        console.error('Error deleting shop:', error);
        alert('Failed to delete shop. Please try again.');
      } finally {
        // Close the modal
        setShowDeleteConfirm(false);
        setShopToDelete(null);
      }
    }
  };

  // View shop details
  const viewShop = (shop: Shop) => {
    setSelectedShop(shop);
    setShowViewShop(true);
  };

  // Edit shop
  const editShop = (shop: Shop) => {
    setSelectedShop(shop);
    // Close view modal if it's open, then open edit modal
    if (showViewShop) {
      setShowViewShop(false);
    }
    setShowEditShop(true);
  };

  // Suspend/Activate shop
  const toggleShopStatus = async (shopId: number) => {
    const shopToUpdate = shops.find(s => s.id === shopId);
    if (shopToUpdate) {
      const statusOrder = ['active', 'pending', 'suspended', 'inactive'];
      const currentIndex = statusOrder.indexOf(shopToUpdate.status);
      const nextIndex = (currentIndex + 1) % statusOrder.length;
      const newStatus = statusOrder[nextIndex] as 'active' | 'pending' | 'suspended' | 'inactive';
      const action = newStatus === 'active' ? 'activate' : 
                     newStatus === 'pending' ? 'set to pending' :
                     newStatus === 'suspended' ? 'suspend' : 'deactivate';
      
      setStatusChangeData({
        shop: shopToUpdate,
        newStatus,
        action
      });
      setShowStatusConfirm(true);
    }
  };

  const confirmStatusChange = async () => {
    if (statusChangeData) {
      try {
        // Send PUT request to update shop status in the backend
        const response = await axios.put(`${API_BASE_URL}/${statusChangeData.shop.id}`, { 
          status: statusChangeData.newStatus 
        });
        
        if (response.data.success) {
          // Refresh the shops data to show the latest changes
          await fetchShops();
          setSuccessMessage(`Shop ${statusChangeData.action}ed successfully!`);
          console.log(`Shop ${statusChangeData.action}ed successfully`);
        } else {
          throw new Error(response.data.error || `Failed to ${statusChangeData.action} shop`);
        }
      } catch (error) {
        console.error(`Error ${statusChangeData.action}ing shop:`, error);
        alert(`Failed to ${statusChangeData.action} shop. Please try again.`);
      } finally {
        // Close the modal
        setShowStatusConfirm(false);
        setStatusChangeData(null);
      }
    }
  };

  // Handle edit shop submission
  const handleEditShop = async (shopData: any) => {
    if (selectedShop) {
      try {
        // Debug: Log the received form data
        console.log('Received form data:', shopData);
        console.log('Selected shop before update:', selectedShop);
        
        // Map the complex form data to the backend API structure
        const shopUpdateData = {
          shopName: shopData.shopName,
          ownerName: shopData.ownerName,
          category: shopData.category,
          status: shopData.status || selectedShop.status,
          ownerEmail: shopData.ownerEmail,
          ownerPhone: shopData.ownerPhone,
          addressLine1: shopData.address.addressLine1,
          addressLine2: shopData.address.addressLine2,
          addressLine3: shopData.address.addressLine3,
          state: shopData.address.state,
          district: shopData.address.district,
          pincode: shopData.address.pincode,
          country: shopData.address.country
        };

        // Debug: Log the mapped data being sent to API
        console.log('Data being sent to API:', shopUpdateData);

        // Send PUT request to update shop in the backend
        const response = await axios.put(`${API_BASE_URL}/${selectedShop.id}`, shopUpdateData);
        
        if (response.data.success) {
          // Close edit modal
          setShowEditShop(false);
          
          // Refresh the shops data to show the latest changes
          await fetchShops();
          
          // Update selectedShop with the response data and show view modal
          const updatedShop = response.data.data;
          setSelectedShop(updatedShop);
          setShowViewShop(true);
          setSuccessMessage('Shop updated successfully!');
          
          // Show success message (optional)
          console.log('Shop updated successfully');
        } else {
          throw new Error(response.data.error || 'Failed to update shop');
        }
      } catch (error) {
        console.error('Error updating shop:', error);
        // You could add error handling here, like showing an error message to the user
        alert('Failed to update shop. Please try again.');
      }
    }
  };

  // Close all shop modals and reset state
  const closeAllShopModals = () => {
    setShowViewShop(false);
    setShowEditShop(false);
    setShowDeleteConfirm(false);
    setShowStatusConfirm(false);
    setSelectedShop(null);
    setShopToDelete(null);
    setStatusChangeData(null);
    setCurrentStep(1);
    setShopFormErrors({});
    clearAllMessages(); // Clear success message when closing modals
  };

  // Filter functions
  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    const emptyFilters = {
      status: [] as string[],
      category: [] as string[],
      shopType: [] as string[]
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (appliedFilters.status.length > 0) count++;
    if (appliedFilters.category.length > 0) count++;
    if (appliedFilters.shopType.length > 0) count++;
    return count;
  };

  // Open shop client manager
  const openShopClientManager = (shop: Shop) => {
    setSelectedShopForClients(shop);
    setShowShopClientManager(true);
  };

  // Close shop client manager
  const closeShopClientManager = () => {
    setShowShopClientManager(false);
    setSelectedShopForClients(null);
  };

  // Handle clients changed callback
  const handleClientsChanged = () => {
    // Refresh shops data if needed
    fetchShops();
  };

  if (loading && shops.length === 0) {
    return (
      <div className="user-management">
        <div className="loading-container">
          <div className="loading-spinner">🔄</div>
          <p>Loading shops...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management">
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button
              onClick={() => fetchShops()}
              className="retry-btn"
            >🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-management">
      {/* Header */}
      <div className="users-header">
        <div>
          <h1>Shops</h1>
          <p>Manage shops and their information</p>
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
                fetchShops(1, recordsPerPage, searchFilter);
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
              placeholder="Search shops by name (min 3 letters)..."
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
            �� Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </button>
          <button 
            className="add-user-btn"
            onClick={() => setShowAddForm(true)}
          >
            ➕ Add Shop
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
                {['active', 'pending', 'suspended', 'inactive'].map(status => (
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
                      {status === 'active' ? '🟢 Active' : 
                       status === 'pending' ? '🟡 Pending' :
                       status === 'suspended' ? '🟠 Suspended' :
                       '⚫ Inactive'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Shop Type Filter */}
            <div className="filter-group">
              <label className="filter-label">🏪 Shop Type</label>
              <div className="filter-options">
                {['retail', 'wholesale', 'ecommerce', 'service', 'restaurant', 'other'].map(type => (
                  <label key={type} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.shopType.includes(type)}
                      onChange={(e) => {
                        const newType = e.target.checked
                          ? [...filters.shopType, type]
                          : filters.shopType.filter((t: string) => t !== type);
                        handleFilterChange('shopType', newType);
                      }}
                    />
                    <span className="checkbox-text">
                      {type === 'retail' ? 'Retail Store' :
                       type === 'wholesale' ? 'Wholesale Business' :
                       type === 'ecommerce' ? 'E-commerce' :
                       type === 'service' ? 'Service Provider' :
                       type === 'restaurant' ? 'Restaurant/Food' : 'Other'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <label className="filter-label">🏷️ Category</label>
              <div className="filter-options">
                {['electronics', 'clothing', 'food', 'healthcare', 'automotive', 'beauty', 'home', 'sports', 'books', 'jewelry', 'pharmaceuticals', 'hardware', 'furniture', 'other'].map(category => (
                  <label key={category} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(category)}
                      onChange={(e) => {
                        const newCategory = e.target.checked
                          ? [...filters.category, category]
                          : filters.category.filter((c: string) => c !== category);
                        handleFilterChange('category', newCategory);
                      }}
                    />
                    <span className="checkbox-text">
                      {getCategoryDisplay(category)}
                    </span>
                  </label>
                ))}
              </div>
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

      {/* Add Shop Form */}
      {showAddForm && (
        <ShopForm
          isOpen={showAddForm}
          onClose={() => {
            setShowAddForm(false);
            setCurrentStep(1);
                    setShopFormErrors({});
        clearAllMessages(); // Clear success message on close
          }}
          onSubmit={handleAddShop}
          mode="add"
        />
      )}

      {/* Edit Shop Form */}
      {showEditShop && selectedShop && (
        <ShopForm
          isOpen={showEditShop}
          onClose={() => {
            setShowEditShop(false);
            // Return to view mode instead of clearing selectedShop
            setShowViewShop(true);
            clearAllMessages(); // Clear success message on close
          }}
          onSubmit={handleEditShop}
          mode="edit"
          initialData={{
            shopName: selectedShop.shopName,
            shopType: (selectedShop.shopType || 'retail') as 'retail' | 'wholesale' | 'ecommerce' | 'service' | 'restaurant' | 'other',
            category: selectedShop.category,
            description: '',
            ownerName: selectedShop.ownerName,
            ownerEmail: selectedShop.ownerEmail,
            ownerPhone: selectedShop.ownerPhone || '',
            address: {
              addressLine1: selectedShop.addressLine1 || '',
              addressLine2: selectedShop.addressLine2 || '',
              addressLine3: selectedShop.addressLine3 || '',
              state: selectedShop.state || 'West Bengal',
              district: selectedShop.district || 'Kolkata',
              pincode: selectedShop.pincode || '',
              country: selectedShop.country || 'India'
            },
            gstNumber: {
              number: '',
              verificationStatus: 'pending'
            },
            panNumber: {
              number: '',
              verificationStatus: 'pending'
            },
            businessLicenseNumber: '',
            registrationDate: new Date().toISOString().split('T')[0],
            shopPhoneNumbers: [{
              id: 'phone-1',
              countryCode: '+91',
              number: selectedShop.ownerPhone || '',
              type: 'primary',
              isVerified: false
            }],
            shopEmail: selectedShop.ownerEmail || '',
            website: '',
            annualRevenue: 0,
            employeeCount: 1,
            documents: [],
            status: selectedShop.status as any
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && shopToDelete && (
        <div className="shop-form-overlay">
          <div className="shop-form-modal" style={{ maxWidth: '400px' }}>
            <div className="shop-form-header">
              <h2>Delete Shop</h2>
              <button className="close-button" onClick={() => {
                setShowDeleteConfirm(false);
                setShopToDelete(null);
              }}>×</button>
            </div>
            
            <div className="shop-form" style={{ padding: '32px', textAlign: 'center' }}>
              <div className="delete-warning" style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ marginBottom: '12px', color: '#d32f2f' }}>Are you sure?</h3>
                <p style={{ color: '#666', lineHeight: '1.5' }}>
                  You are about to delete <strong>{shopToDelete.shopName}</strong>. 
                  This action cannot be undone.
                </p>
              </div>
              
              <div className="delete-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setShopToDelete(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="delete-btn"
                  onClick={confirmDelete}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#d32f2f',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Delete Shop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {showStatusConfirm && statusChangeData && (
        <div className="shop-form-overlay">
          <div className="shop-form-modal" style={{ maxWidth: '400px' }}>
            <div className="shop-form-header">
              <h2>Change Shop Status</h2>
              <button className="close-button" onClick={() => {
                setShowStatusConfirm(false);
                setStatusChangeData(null);
              }}>×</button>
            </div>
            
            <div className="shop-form" style={{ padding: '32px', textAlign: 'center' }}>
              <div className="status-change-info" style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
                <h3 style={{ marginBottom: '12px', color: '#1976d2' }}>Update Shop Status</h3>
                <p style={{ color: '#666', lineHeight: '1.5', marginBottom: '16px' }}>
                  You are about to change the status of <strong>{statusChangeData.shop.shopName}</strong>.
                </p>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                    Current Status:
                  </p>
                  <span className={`status-badge ${statusChangeData.shop.status}`}>
                    {statusChangeData.shop.status === 'active' ? '🟢 Active' : 
                     statusChangeData.shop.status === 'pending' ? '🟡 Pending' :
                     statusChangeData.shop.status === 'suspended' ? '🟠 Suspended' :
                     '⚫ Inactive'}
                  </span>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#666' }}>
                    New Status:
                  </p>
                  <span className={`status-badge ${statusChangeData.newStatus}`}>
                    {statusChangeData.newStatus === 'active' ? '🟢 Active' : 
                     statusChangeData.newStatus === 'pending' ? '🟡 Pending' :
                     statusChangeData.newStatus === 'suspended' ? '🟠 Suspended' :
                     '⚫ Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="status-change-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setShowStatusConfirm(false);
                    setStatusChangeData(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-btn"
                  onClick={confirmStatusChange}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Shop Modal */}
      {showViewShop && selectedShop && (
        <div className="shop-form-overlay">
          <div className="shop-form-modal">
            <div className="shop-form-header">
              <h2>Shop Details</h2>
              <button className="close-button" onClick={closeAllShopModals}>×</button>
            </div>
            
            <div className="shop-form" style={{ padding: '32px' }}>
              <div className="form-section">
                <h4>Shop Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Shop Name:</span>
                  <span className="detail-value">{selectedShop.shopName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{getCategoryDisplay(selectedShop.category)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">
                    <span className={`status-badge ${selectedShop.status || 'active'}`}>
                      {selectedShop.status === 'active' ? '🟢 Active' : 
                       selectedShop.status === 'pending' ? '🟡 Pending' :
                       selectedShop.status === 'suspended' ? '🟠 Suspended' :
                       '⚫ Inactive'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="form-section">
                <h4>Owner Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Owner Name:</span>
                  <span className="detail-value">{selectedShop.ownerName}</span>
                </div>
                {selectedShop.ownerEmail && (
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedShop.ownerEmail}</span>
                  </div>
                )}
                {selectedShop.ownerPhone && (
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedShop.ownerPhone}</span>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h4>Address</h4>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{selectedShop.addressLine1}, {selectedShop.district}, {selectedShop.state} {selectedShop.pincode}</span>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => editShop(selectedShop)}
                  className="btn-primary"
                >
                  ✏️ Edit Shop
                </button>
                <button 
                  type="button" 
                  onClick={closeAllShopModals}
                  className="btn-cancel"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop Display */}
      {viewMode === 'cards' ? (
        <div className="users-grid">
          {shops.map((shop: Shop) => (
            <div key={shop.id} className="user-card">
              <div className="user-avatar">
                <span className="avatar-initials">
                  {getShopInitials(shop.shopName)}
                </span>
              </div>
              <div className="user-main-info">
                <div className="user-header">
                  <h3 className="full-name">{shop.shopName}</h3>
                  <span className={`status-badge ${shop.status || 'active'}`}>
                    {shop.status === 'active' ? '🟢' : shop.status === 'pending' ? '🟡' : shop.status === 'suspended' ? '🟠' : '🔴'} {getStatusDisplay(shop.status || 'active')}
                  </span>
                </div>
                <div className="user-details">
                  <div className="detail-row">
                    <span className="detail-label">Owner:</span>
                    <span className="detail-value">{shop.ownerName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{getCategoryDisplay(shop.category)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{shop.addressLine1}, {shop.district}, {shop.state} {shop.pincode}</span>
                  </div>

                </div>
              </div>
              <div className="user-actions">
                <button 
                  className="action-btn view-btn"
                  title="View shop details"
                  onClick={() => viewShop(shop)}
                >
                  👁️
                </button>
                <button 
                  className="action-btn edit-btn"
                  title="Edit shop"
                  onClick={() => editShop(shop)}
                >
                  ✏️
                </button>
                <button 
                  className="action-button toggle-status"
                  onClick={() => toggleShopStatus(shop.id!)}
                  title={`Cycle status (${shop.status || 'active'} -> next status)`}
                >
                  {shop.status === 'active' ? '⏸️' : 
                   shop.status === 'pending' ? '⏳' :
                   shop.status === 'suspended' ? '▶️' : '🔄'}
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={() => deleteShop(shop.id)}
                  title="Delete shop"
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
                <th>Shop</th>
                <th>Owner</th>
                <th>Category</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop: Shop) => (
                <tr key={shop.id} className="user-row">
                  <td className="client-info">
                    <div className="client-avatar">
                      <span className="table-avatar-initials">
                        {getShopInitials(shop.shopName)}
                      </span>
                    </div>
                    <div className="client-name">
                      {shop.shopName}
                    </div>
                  </td>
                  <td className="address-cell">
                    <div className="cell-content">
                      {shop.ownerName}
                    </div>
                  </td>
                  <td className="mobile-cell">
                    <div className="cell-content">
                      {getCategoryDisplay(shop.category)}
                    </div>
                  </td>
                  <td className="address-cell">
                    <div className="cell-content">
                      {shop.addressLine1}, {shop.district}, {shop.state} {shop.pincode}
                    </div>
                  </td>
                  <td className="status-cell">
                    <span className={`table-status-badge ${shop.status || 'active'}`}>
                      {shop.status === 'active' ? '🟢' : shop.status === 'pending' ? '🟡' : shop.status === 'suspended' ? '🟠' : '🔴'} {getStatusDisplay(shop.status || 'active')}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="table-actions">
                      <button 
                        className="table-action-btn view-btn"
                        title="View shop details"
                        onClick={() => viewShop(shop)}
                      >
                        👁️
                      </button>
                      <button 
                        className="table-action-btn edit-btn"
                        title="Edit shop"
                        onClick={() => editShop(shop)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="table-action-btn clients-btn"
                        title="Manage clients"
                        onClick={() => openShopClientManager(shop)}
                      >
                        👥
                      </button>
                      <button 
                        className="table-action-btn toggle-status"
                        title={`Cycle status (${shop.status || 'active'} -> next status)`}
                        onClick={() => toggleShopStatus(shop.id!)}
                      >
                        {shop.status === 'active' ? '⏸️' : 
                         shop.status === 'pending' ? '⏳' :
                         shop.status === 'suspended' ? '▶️' : '🔄'}
                      </button>
                      <button 
                        className="table-action-btn delete-btn"
                        onClick={() => deleteShop(shop.id)}
                        title="Delete shop"
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
              Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} shops
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
      {shops.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🏪</div>
          <h3>No shops found</h3>
          <p>Get started by adding your first shop</p>
          <button 
            className="add-first-user-btn"
            onClick={() => setShowAddForm(true)}
          >
            Add First Shop
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <SuccessMessage message={successMessage} onClose={clearSuccessMessage} />
      )}

      {/* Shop Client Manager */}
      {showShopClientManager && selectedShopForClients && (
        <ShopClientManager
          shopId={selectedShopForClients.id!}
          shopName={selectedShopForClients.shopName}
          isOpen={showShopClientManager}
          onClose={closeShopClientManager}
          onClientsChanged={handleClientsChanged}
        />
      )}
    </div>
  );
};

export default ShopManagement;