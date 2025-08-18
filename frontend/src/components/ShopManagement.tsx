import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import ShopForm from './ShopForm';
import './UserManagement.css'; // Reuse the same CSS for consistent styling

interface Shop {
  id: number;
  shopName: string;
  ownerName: string;
  email: string;
  phone?: string;
  address?: string;
  category: string;
  shopType?: string; // Added shopType
  status?: 'active' | 'pending' | 'suspended' | 'inactive';
  registrationDate?: string;
  lastActivity?: string;
  revenue?: number;

}

const ShopManagement: React.FC = () => {
  // State management
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
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
      district: 'Nadia',
      pincode: '741501',
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

  // Generate mock shops data
  const generateMockShops = (): Shop[] => {
    const shops: Shop[] = [];
    const shopNames = ['Tech Store', 'Fashion Hub', 'Food Corner', 'Book World', 'Sports Zone', 'Home Decor', 'Electronics Plus', 'Beauty Salon'];
    const ownerNames = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Singh', 'Vivek Gupta', 'Ananya Reddy', 'Rohit Yadav', 'Kavya Nair'];
    const categories = ['electronics', 'clothing', 'food', 'healthcare', 'automotive', 'beauty', 'home', 'sports', 'books', 'jewelry', 'pharmaceuticals', 'hardware', 'furniture', 'other'];
    const shopTypes = ['retail', 'wholesale', 'ecommerce', 'service', 'restaurant', 'other'];
    const statuses: ('active' | 'suspended')[] = ['active', 'suspended'];
    const addresses = ['MG Road, Mumbai', 'Park Street, Kolkata', 'Brigade Road, Bangalore', 'Connaught Place, Delhi'];

    for (let i = 1; i <= 100; i++) {
      const shopName = `${shopNames[Math.floor(Math.random() * shopNames.length)]} ${i}`;
      const ownerName = ownerNames[Math.floor(Math.random() * ownerNames.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const shopType = shopTypes[Math.floor(Math.random() * shopTypes.length)];
      
      shops.push({
        id: i,
        shopName,
        ownerName,
        email: `${shopName.toLowerCase().replace(/\s+/g, '')}${i}@shop.com`,
        phone: `${Math.floor(Math.random() * 4) + 6}${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
        address: addresses[Math.floor(Math.random() * addresses.length)],
        category,
        shopType,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        registrationDate: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        lastActivity: Math.random() > 0.3 ? `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` : undefined,
        revenue: Math.floor(Math.random() * 1000000) + 50000,
    
      });
    }
    return shops;
  };

  const mockShops: Shop[] = generateMockShops();

  // Search and filter functions
  const handleSearchChange = (search: string) => {
    setSearchFilter(search);
    setCurrentPage(1);
  };

  const fetchShops = useCallback(async (page = currentPage, limit = recordsPerPage, search = searchFilter) => {
    try {
      setLoading(true);
      
      // Simulate API call with mock data
      let filteredShops = [...mockShops];
      
      // Apply search filter (minimum 3 characters)
      if (search && search.length >= 3) {
        const searchLower = search.toLowerCase();
        filteredShops = filteredShops.filter(shop => 
          shop.shopName.toLowerCase().includes(searchLower) ||
          shop.ownerName.toLowerCase().includes(searchLower) ||
          shop.email?.toLowerCase().includes(searchLower) ||
          shop.category.toLowerCase().includes(searchLower)
        );
      }

      // Apply status filter
      if (appliedFilters.status.length > 0) {
        filteredShops = filteredShops.filter(shop => 
          appliedFilters.status.includes(shop.status || 'active')
        );
      }

      // Apply category filter
      if (appliedFilters.category.length > 0) {
        filteredShops = filteredShops.filter(shop => 
          appliedFilters.category.includes(shop.category)
        );
      }

      // Apply shopType filter
      if (appliedFilters.shopType.length > 0) {
        filteredShops = filteredShops.filter(shop => 
          appliedFilters.shopType.includes(shop.shopType || 'retail')
        );
      }

      // Sort shops: first by status (active first), then alphabetically by shop name
      filteredShops.sort((a, b) => {
        // First sort by status: active comes first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        
        // Then sort alphabetically by shop name
        return a.shopName.localeCompare(b.shopName);
      });

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedShops = filteredShops.slice(startIndex, endIndex);
      
      setShops(paginatedShops);
      setTotalRecords(filteredShops.length);
      setTotalPages(Math.ceil(filteredShops.length / limit));
      setError(null);
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

  const handleAddShop = (shopData: any) => {
    const shop: Shop = {
      id: Date.now(),
      shopName: shopData.shopName,
      ownerName: shopData.ownerName,
      email: shopData.ownerEmail,
      phone: shopData.ownerPhone,
      address: `${shopData.address.addressLine1}, ${shopData.address.district}, ${shopData.address.state} ${shopData.address.pincode}`,
      category: shopData.category,
      shopType: shopData.shopType, // Added shopType
      status: shopData.status || 'active',
      registrationDate: shopData.registrationDate || new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0],
      revenue: shopData.annualRevenue || Math.floor(Math.random() * 500000) + 50000,
      
    };

    setShops([...shops, shop]);
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
        district: 'Nadia',
        pincode: '741501',
        country: 'India'
      },
      email: '',
      phone: ''
    });
    setShopFormErrors({});
    setCurrentStep(1);
    setShowAddForm(false);
    setError(null);
  };

  const deleteShop = async (shopId: number) => {
    if (window.confirm('Are you sure you want to delete this shop?')) {
      try {
        const index = mockShops.findIndex(shop => shop.id === shopId);
        if (index > -1) {
          mockShops.splice(index, 1);
          fetchShops();
        }
      } catch (error) {
        console.error('Error deleting shop:', error);
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
  const toggleShopStatus = (shopId: number) => {
    const shop = mockShops.find(s => s.id === shopId);
    if (shop) {
      const newStatus = shop.status === 'active' ? 'suspended' : 'active';
      const action = newStatus === 'suspended' ? 'suspend' : 'activate';
      
      if (window.confirm(`Are you sure you want to ${action} this shop?`)) {
        shop.status = newStatus;
        fetchShops();
      }
    }
  };

  // Handle edit shop submission
  const handleEditShop = (shopData: any) => {
    if (selectedShop) {
      const index = mockShops.findIndex(shop => shop.id === selectedShop.id);
      if (index > -1) {
        mockShops[index] = {
          ...mockShops[index],
          shopName: shopData.shopName,
          ownerName: shopData.ownerName,
          category: shopData.category,
          status: shopData.status || mockShops[index].status,
          email: shopData.ownerEmail,
          phone: shopData.ownerPhone,
          address: `${shopData.address.addressLine1}, ${shopData.address.district}, ${shopData.address.state} ${shopData.address.pincode}`
        };
        fetchShops();
        setShowEditShop(false);
        
        // Update selectedShop with new data and show view modal
        const updatedShop = mockShops[index];
        setSelectedShop(updatedShop);
        setShowViewShop(true);
      }
    }
  };

  // Close all shop modals and reset state
  const closeAllShopModals = () => {
    setShowViewShop(false);
    setShowEditShop(false);
    setSelectedShop(null);
    setCurrentStep(1);
    setShopFormErrors({});
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
                {['active', 'suspended'].map(status => (
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
                      {status === 'active' ? '🟢 Active' : '🟠 Suspended'}
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
          }}
          onSubmit={handleEditShop}
          mode="edit"
          initialData={{
            shopName: selectedShop.shopName,
            ownerName: selectedShop.ownerName,
            category: selectedShop.category,
            status: selectedShop.status as any,
            ownerEmail: selectedShop.email,
            ownerPhone: selectedShop.phone || '',
            address: {
              addressLine1: selectedShop.address?.split(',')[0] || '',
              addressLine2: '',
              addressLine3: '',
              state: selectedShop.address?.split(',')[1]?.trim() || 'West Bengal',
              district: selectedShop.address?.split(',')[1]?.trim() || 'Nadia',
              pincode: selectedShop.address?.split(',')[2]?.trim() || '741501',
              country: 'India'
            }
          }}
        />
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
                      {selectedShop.status === 'active' ? '🟢 Active' : '🟠 Suspended'}
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
                {selectedShop.email && (
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedShop.email}</span>
                  </div>
                )}
                {selectedShop.phone && (
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedShop.phone}</span>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h4>Address</h4>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{selectedShop.address}</span>
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
                    <span className="detail-value">{shop.address}</span>
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
                  className="action-btn suspend-btn"
                  title={shop.status === 'active' ? 'Suspend shop' : 'Activate shop'}
                  onClick={() => toggleShopStatus(shop.id)}
                >
                  {shop.status === 'active' ? '⏸️' : '▶️'}
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
                      {shop.address}
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
                        className="table-action-btn suspend-btn"
                        title={shop.status === 'active' ? 'Suspend shop' : 'Activate shop'}
                        onClick={() => toggleShopStatus(shop.id)}
                      >
                        {shop.status === 'active' ? '⏸️' : '▶️'}
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
    </div>
  );
};

export default ShopManagement;