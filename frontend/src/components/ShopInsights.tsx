import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ShopInsights.css';

interface Shop {
  id: number;
  shopName: string;
  ownerName: string;
  category?: string;
  status: string;
}

const ShopInsights: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all shops on component mount
  useEffect(() => {
    fetchShops();
  }, []);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/shops');
      if (response.data.success) {
        setShops(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
      const filtered = shops.filter(shop => 
        shop.shopName.toLowerCase().includes(query.toLowerCase()) ||
        shop.ownerName.toLowerCase().includes(query.toLowerCase()) ||
        (shop.category && shop.category.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredShops(filtered);
      setShowDropdown(true);
    } else {
      setFilteredShops([]);
      setShowDropdown(false);
    }
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    setSearchQuery(shop.shopName);
    setShowDropdown(false);
    // TODO: Load shop insights/analytics for selected shop
    console.log('Selected shop:', shop);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedShop) {
      // TODO: Implement shop insights display
      console.log('Show insights for:', selectedShop);
    }
  };

  return (
    <div className="shop-insights">
      <div className="shop-insights-container">
        <div className="shop-insights-header">
          <h1>Shop Insights</h1>
          <p>Type and discover analytics and insights for any shop</p>
        </div>
        
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container" ref={dropdownRef}>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search for shop insights..."
                className="search-input"
                autoComplete="off"
              />
              <button type="submit" className="search-button">
                🔍
              </button>
              
              {/* Dropdown for search results */}
              {showDropdown && filteredShops.length > 0 && (
                <div className="search-dropdown">
                  {filteredShops.slice(0, 10).map((shop) => (
                    <div
                      key={shop.id}
                      className="dropdown-item"
                      onClick={() => handleShopSelect(shop)}
                    >
                      <div className="shop-info">
                        <div className="shop-name">{shop.shopName}</div>
                        <div className="shop-details">
                          Owner: {shop.ownerName}
                          {shop.category && ` • ${shop.category}`}
                        </div>
                      </div>
                      <div className={`shop-status status-${shop.status}`}>
                        {shop.status}
                      </div>
                    </div>
                  ))}
                  {filteredShops.length > 10 && (
                    <div className="dropdown-footer">
                      {filteredShops.length - 10} more results...
                    </div>
                  )}
                </div>
              )}
              
              {/* No results message */}
              {showDropdown && searchQuery.trim().length > 0 && filteredShops.length === 0 && !loading && (
                <div className="search-dropdown">
                  <div className="dropdown-item no-results">
                    No shops found matching "{searchQuery}"
                  </div>
                </div>
              )}
              
              {/* Loading indicator */}
              {loading && (
                <div className="search-dropdown">
                  <div className="dropdown-item loading">
                    Loading shops...
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShopInsights;
