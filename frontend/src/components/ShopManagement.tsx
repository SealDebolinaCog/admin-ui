import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './UserManagement.css'; // Reuse the same CSS for consistent styling

interface Shop {
  id: number;
  shopName: string;
  ownerName: string;
  email: string;
  phone?: string;
  address?: string;
  category: string;
  status?: 'active' | 'pending' | 'suspended' | 'inactive';
  registrationDate?: string;
  lastActivity?: string;
  revenue?: number;
  rating?: number;
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
    registrationDate: { from: '', to: '' },
    lastActivity: { from: '', to: '' }
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

  // Validation functions (similar to ClientForm)
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return {
      isValid: phoneRegex.test(phone),
      error: phoneRegex.test(phone) ? null : 'Phone number must be 10 digits starting with 6-9'
    };
  };

  const validatePincode = (pincode: string) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  };

  const validateAddress = (address: string) => {
    const addressRegex = /^[a-zA-Z0-9\s\/&,.]+$/;
    return {
      isValid: addressRegex.test(address) && address.trim().length > 0,
      error: !addressRegex.test(address) ? 'Address can only contain letters, numbers, spaces, /, &, comma, and period' : 
             address.trim().length === 0 ? 'Address cannot be empty' : null
    };
  };

  // Generate mock shops data
  const generateMockShops = (): Shop[] => {
    const shops: Shop[] = [];
    const shopNames = ['Tech Store', 'Fashion Hub', 'Food Corner', 'Book World', 'Sports Zone', 'Home Decor', 'Electronics Plus', 'Beauty Salon'];
    const ownerNames = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Singh', 'Vivek Gupta', 'Ananya Reddy', 'Rohit Yadav', 'Kavya Nair'];
    const categories = ['electronics', 'fashion', 'food', 'books', 'sports', 'home', 'beauty', 'retail'];
    const statuses: ('active' | 'pending' | 'suspended' | 'inactive')[] = ['active', 'pending', 'suspended', 'inactive'];
    const addresses = ['MG Road, Mumbai', 'Park Street, Kolkata', 'Brigade Road, Bangalore', 'Connaught Place, Delhi'];

    for (let i = 1; i <= 100; i++) {
      const shopName = `${shopNames[Math.floor(Math.random() * shopNames.length)]} ${i}`;
      const ownerName = ownerNames[Math.floor(Math.random() * ownerNames.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      shops.push({
        id: i,
        shopName,
        ownerName,
        email: `${shopName.toLowerCase().replace(/\s+/g, '')}${i}@shop.com`,
        phone: `${Math.floor(Math.random() * 4) + 6}${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
        address: addresses[Math.floor(Math.random() * addresses.length)],
        category,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        registrationDate: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        lastActivity: Math.random() > 0.3 ? `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` : undefined,
        revenue: Math.floor(Math.random() * 1000000) + 50000,
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10 // 3.0 to 5.0 rating
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

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Helper functions
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'suspended': return 'Suspended';
      case 'inactive': return 'Inactive';
      default: return 'Active';
    }
  };

  const getCategoryDisplay = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getShopInitials = (shopName: string) => {
    return shopName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Form handlers
  const validateShopForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (currentStep === 1) {
      // Step 1: Shop Details validation
      if (!shopFormData.shopName.trim()) {
        newErrors.shopName = 'Shop name is required';
      } else if (!/^[a-zA-Z0-9\s&.,-]+$/.test(shopFormData.shopName)) {
        newErrors.shopName = 'Shop name can only contain letters, numbers, spaces, &, ., comma, and -';
      }

      if (!shopFormData.ownerName.trim()) {
        newErrors.ownerName = 'Owner name is required';
      } else if (!/^[a-zA-Z\s]+$/.test(shopFormData.ownerName)) {
        newErrors.ownerName = 'Owner name must contain only letters and spaces';
      }

      if (!shopFormData.category) {
        newErrors.category = 'Category is required';
      }
    } else if (currentStep === 2) {
      // Step 2: Address and Contact validation
      if (!shopFormData.address.addressLine1.trim()) {
        newErrors.addressLine1 = 'Address line 1 is required';
      } else {
        const addressValidation = validateAddress(shopFormData.address.addressLine1);
        if (!addressValidation.isValid) {
          newErrors.addressLine1 = addressValidation.error || 'Invalid address format';
        }
      }

      if (shopFormData.address.addressLine2.trim()) {
        const addressValidation = validateAddress(shopFormData.address.addressLine2);
        if (!addressValidation.isValid) {
          newErrors.addressLine2 = addressValidation.error || 'Invalid address format';
        }
      }

      if (shopFormData.address.addressLine3.trim()) {
        const addressValidation = validateAddress(shopFormData.address.addressLine3);
        if (!addressValidation.isValid) {
          newErrors.addressLine3 = addressValidation.error || 'Invalid address format';
        }
      }

      if (!shopFormData.address.state) newErrors.state = 'State is required';
      if (!shopFormData.address.district) newErrors.district = 'District is required';
      if (!shopFormData.address.pincode.trim()) {
        newErrors.pincode = 'Pincode is required';
      } else if (!validatePincode(shopFormData.address.pincode)) {
        newErrors.pincode = 'Invalid pincode format';
      }

      if (!shopFormData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(shopFormData.email)) {
        newErrors.email = 'Invalid email format';
      }

      // Phone number validation
      if (shopFormData.phone.trim()) {
        const phoneValidation = validatePhone(shopFormData.phone);
        if (!phoneValidation.isValid) {
          newErrors.phone = phoneValidation.error || 'Invalid phone number format';
        }
      }
    }

    setShopFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateShopForm()) {
      if (currentStep < 2) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleAddShop = () => {
    if (!validateShopForm()) {
      setError('Please fix all validation errors before submitting');
      return;
    }

    const shop: Shop = {
      id: Date.now(),
      shopName: shopFormData.shopName,
      ownerName: shopFormData.ownerName,
      email: shopFormData.email,
      phone: shopFormData.phone.trim() || undefined,
      address: `${shopFormData.address.addressLine1}, ${shopFormData.address.district}, ${shopFormData.address.state} ${shopFormData.address.pincode}`,
      category: shopFormData.category,
      status: 'active',
      registrationDate: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 500000) + 50000,
      rating: Math.floor(Math.random() * 5) + 1
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
      registrationDate: { from: '', to: '' },
      lastActivity: { from: '', to: '' }
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (appliedFilters.status.length > 0) count++;
    if (appliedFilters.category.length > 0) count++;
    if (appliedFilters.registrationDate.from || appliedFilters.registrationDate.to) count++;
    if (appliedFilters.lastActivity.from || appliedFilters.lastActivity.to) count++;
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
    <div className="user-management">
      <div className="user-header">
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
            🔍 Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
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
                       status === 'suspended' ? '🟠 Suspended' : '🔴 Inactive'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <label className="filter-label">🏷️ Category</label>
              <div className="filter-options">
                {['electronics', 'fashion', 'food', 'books', 'sports', 'home', 'beauty', 'retail'].map(category => (
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
        <div className="client-form-overlay">
          <div className="client-form-modal">
            <div className="client-form-header">
              <h2>Add New Shop</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setCurrentStep(1);
                  setShopFormErrors({});
                }}
              >
                ×
              </button>
            </div>
            
            <div className="form-steps">
              <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                <span>1</span> Shop Details
              </div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                <span>2</span> Address & Contact
              </div>
            </div>

            <form className="client-form">
              {/* Step 1: Shop Details */}
              {currentStep === 1 && (
                <div className="form-step">
                  <h3>Shop Details</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="shopName">Shop Name *</label>
                      <input
                        type="text"
                        id="shopName"
                        value={shopFormData.shopName}
                        onChange={(e) => setShopFormData({...shopFormData, shopName: e.target.value})}
                        className={shopFormErrors.shopName ? 'error' : ''}
                      />
                      {shopFormErrors.shopName && <span className="error-text">{shopFormErrors.shopName}</span>}
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="ownerName">Owner Name *</label>
                      <input
                        type="text"
                        id="ownerName"
                        value={shopFormData.ownerName}
                        onChange={(e) => setShopFormData({...shopFormData, ownerName: e.target.value})}
                        className={shopFormErrors.ownerName ? 'error' : ''}
                      />
                      {shopFormErrors.ownerName && <span className="error-text">{shopFormErrors.ownerName}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="category">Category *</label>
                      <select
                        id="category"
                        value={shopFormData.category}
                        onChange={(e) => setShopFormData({...shopFormData, category: e.target.value})}
                        className={shopFormErrors.category ? 'error' : ''}
                      >
                        <option value="electronics">Electronics</option>
                        <option value="fashion">Fashion</option>
                        <option value="food">Food</option>
                        <option value="books">Books</option>
                        <option value="sports">Sports</option>
                        <option value="home">Home</option>
                        <option value="beauty">Beauty</option>
                        <option value="retail">Retail</option>
                      </select>
                      {shopFormErrors.category && <span className="error-text">{shopFormErrors.category}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Address & Contact */}
              {currentStep === 2 && (
                <div className="form-step">
                  <h3>Address & Contact Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="addressLine1">Address Line 1 *</label>
                      <input
                        type="text"
                        id="addressLine1"
                        value={shopFormData.address.addressLine1}
                        onChange={(e) => setShopFormData({
                          ...shopFormData,
                          address: {...shopFormData.address, addressLine1: e.target.value}
                        })}
                        className={shopFormErrors.addressLine1 ? 'error' : ''}
                      />
                      {shopFormErrors.addressLine1 && <span className="error-text">{shopFormErrors.addressLine1}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="addressLine2">Address Line 2</label>
                      <input
                        type="text"
                        id="addressLine2"
                        value={shopFormData.address.addressLine2}
                        onChange={(e) => setShopFormData({
                          ...shopFormData,
                          address: {...shopFormData.address, addressLine2: e.target.value}
                        })}
                        className={shopFormErrors.addressLine2 ? 'error' : ''}
                      />
                      {shopFormErrors.addressLine2 && <span className="error-text">{shopFormErrors.addressLine2}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="addressLine3">Address Line 3</label>
                      <input
                        type="text"
                        id="addressLine3"
                        value={shopFormData.address.addressLine3}
                        onChange={(e) => setShopFormData({
                          ...shopFormData,
                          address: {...shopFormData.address, addressLine3: e.target.value}
                        })}
                        className={shopFormErrors.addressLine3 ? 'error' : ''}
                      />
                      {shopFormErrors.addressLine3 && <span className="error-text">{shopFormErrors.addressLine3}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group half-width">
                      <label htmlFor="state">State *</label>
                      <select
                        id="state"
                        value={shopFormData.address.state}
                        onChange={(e) => setShopFormData({
                          ...shopFormData,
                          address: {...shopFormData.address, state: e.target.value}
                        })}
                        className={shopFormErrors.state ? 'error' : ''}
                      >
                        {indianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {shopFormErrors.state && <span className="error-text">{shopFormErrors.state}</span>}
                    </div>

                    <div className="form-group half-width">
                      <label htmlFor="district">District *</label>
                      <select
                        id="district"
                        value={shopFormData.address.district}
                        onChange={(e) => setShopFormData({
                          ...shopFormData,
                          address: {...shopFormData.address, district: e.target.value}
                        })}
                        className={shopFormErrors.district ? 'error' : ''}
                      >
                        {westBengalDistricts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                      {shopFormErrors.district && <span className="error-text">{shopFormErrors.district}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group half-width">
                      <label htmlFor="pincode">Pincode *</label>
                      <input
                        type="text"
                        id="pincode"
                        value={shopFormData.address.pincode}
                        onChange={(e) => setShopFormData({
                          ...shopFormData,
                          address: {...shopFormData.address, pincode: e.target.value}
                        })}
                        className={shopFormErrors.pincode ? 'error' : ''}
                      />
                      {shopFormErrors.pincode && <span className="error-text">{shopFormErrors.pincode}</span>}
                    </div>

                    <div className="form-group half-width">
                      <label htmlFor="country">Country</label>
                      <input
                        type="text"
                        id="country"
                        value={shopFormData.address.country}
                        readOnly
                        className="readonly"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        value={shopFormData.email}
                        onChange={(e) => setShopFormData({...shopFormData, email: e.target.value})}
                        className={shopFormErrors.email ? 'error' : ''}
                      />
                      {shopFormErrors.email && <span className="error-text">{shopFormErrors.email}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="text"
                        id="phone"
                        value={shopFormData.phone}
                        onChange={(e) => setShopFormData({...shopFormData, phone: e.target.value})}
                        className={shopFormErrors.phone ? 'error' : ''}
                        placeholder="Enter 10-digit phone number"
                      />
                      {shopFormErrors.phone && <span className="error-text">{shopFormErrors.phone}</span>}
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddForm(false);
                    setCurrentStep(1);
                    setShopFormErrors({});
                  }} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
                
                <div className="nav-buttons">
                  {currentStep > 1 && (
                    <button type="button" onClick={prevStep} className="prev-btn">
                      Previous
                    </button>
                  )}
                  
                  {currentStep < 2 ? (
                    <button type="button" onClick={nextStep} className="next-btn">
                      Next
                    </button>
                  ) : (
                    <button type="button" onClick={handleAddShop} className="submit-btn">
                      Create Shop
                    </button>
                  )}
                </div>
              </div>
            </form>
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
                  <div className="detail-row">
                    <span className="detail-label">Rating:</span>
                    <span className="detail-value">⭐ {shop.rating}/5.0</span>
                  </div>
                </div>
              </div>
              <div className="user-actions">
                <button 
                  className="action-btn view-btn"
                  title="View shop details"
                >
                  👁️
                </button>
                <button 
                  className="action-btn edit-btn"
                  title="Edit shop"
                >
                  ✏️
                </button>
                <button 
                  className="action-btn suspend-btn"
                  title="Suspend shop"
                >
                  ⏸️
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
                <th>Rating</th>
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
                  <td className="mobile-cell">
                    <div className="cell-content">
                      ⭐ {shop.rating}/5.0
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
                      >
                        👁️
                      </button>
                      <button 
                        className="table-action-btn edit-btn"
                        title="Edit shop"
                      >
                        ✏️
                      </button>
                      <button 
                        className="table-action-btn suspend-btn"
                        title="Suspend shop"
                      >
                        ⏸️
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
