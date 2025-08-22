import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ShopDetails.css';

interface Shop {
  id: number;
  shopName: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  category?: string;
  status: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  state?: string;
  district?: string;
  pincode?: string;
  country?: string;
}

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: string;
}

interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  institutionName: string;
  institutionType: string;
  accountHolderNames: string;
  status: string;
  amount: number;
  startDate?: string;
  maturityDate?: string;
  paymentType: string;
}

interface ShopDetailsProps {
  shopId: number;
  onBack: () => void;
}

const ShopDetails: React.FC<ShopDetailsProps> = ({ shopId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'balance'>('accounts');
  const [shop, setShop] = useState<Shop | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShopDetails();
  }, [shopId]);

  const fetchShopDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch shop details
      const shopResponse = await axios.get(`/api/shops/${shopId}`);
      if (shopResponse.data.success) {
        setShop(shopResponse.data.data);
      }

      // Fetch clients linked to this shop
      const clientsResponse = await axios.get(`/api/shops/${shopId}/clients`);
      if (clientsResponse.data.success) {
        setClients(clientsResponse.data.data);
        
        // Fetch accounts for all clients linked to this shop
        if (clientsResponse.data.data.length > 0) {
          const clientIds = clientsResponse.data.data.map((client: Client) => client.id);
          const accountsResponse = await axios.get(`/api/accounts?clientIds=${clientIds.join(',')}`);
          if (accountsResponse.data.success) {
            setAccounts(accountsResponse.data.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching shop details:', error);
      setError('Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId: number): string => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active': return 'status-active';
      case 'suspended': return 'status-suspended';
      case 'closed': return 'status-closed';
      case 'matured': return 'status-matured';
      default: return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="shop-details">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="shop-details">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Shop not found'}</p>
          <button onClick={onBack} className="back-button">
            ← Back to Shop Insights
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-details">
      <div className="shop-details-header">
        <button onClick={onBack} className="back-button">
          ← Back to Shop Insights
        </button>
        <div className="shop-info">
          <h1>{shop.shopName}</h1>
          <div className="shop-meta">
            <span className="owner-info">Owner: {shop.ownerName}</span>
            {shop.category && <span className="category">• {shop.category}</span>}
            <span className={`status-badge ${getStatusBadgeClass(shop.status)}`}>
              {shop.status}
            </span>
          </div>
          {shop.ownerPhone && (
            <div className="contact-info">
              <span>📞 {shop.ownerPhone}</span>
              {shop.ownerEmail && <span>• ✉️ {shop.ownerEmail}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="shop-details-content">
        <div className="tabs-container">
          <div className="tabs-header">
            <button
              className={`tab-button ${activeTab === 'accounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('accounts')}
            >
              Customer Accounts ({accounts.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'balance' ? 'active' : ''}`}
              onClick={() => setActiveTab('balance')}
            >
              Balance Information
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'accounts' && (
              <div className="accounts-tab">
                <div className="tab-header">
                  <h3>Accounts Linked to Shop Customers</h3>
                  <p>All financial accounts belonging to customers associated with this shop</p>
                </div>

                {accounts.length === 0 ? (
                  <div className="empty-state">
                    <h4>No Accounts Found</h4>
                    <p>No customers are currently linked to this shop, or linked customers have no accounts.</p>
                  </div>
                ) : (
                  <div className="accounts-grid">
                    {accounts.map((account) => (
                      <div key={account.id} className="account-card">
                        <div className="account-header">
                          <div className="account-number">
                            <strong>{account.accountNumber}</strong>
                            <span className={`status-badge ${getStatusBadgeClass(account.status)}`}>
                              {account.status}
                            </span>
                          </div>
                          <div className="account-type">{account.accountType}</div>
                        </div>
                        
                        <div className="account-details">
                          <div className="detail-row">
                            <span className="label">Institution:</span>
                            <span className="value">{account.institutionName} ({account.institutionType})</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Account Holders:</span>
                            <span className="value">{account.accountHolderNames}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Amount:</span>
                            <span className="value amount">{formatCurrency(account.amount)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Payment Type:</span>
                            <span className="value">{account.paymentType}</span>
                          </div>
                          {account.startDate && (
                            <div className="detail-row">
                              <span className="label">Start Date:</span>
                              <span className="value">{new Date(account.startDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {account.maturityDate && (
                            <div className="detail-row">
                              <span className="label">Maturity Date:</span>
                              <span className="value">{new Date(account.maturityDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {clients.length > 0 && (
                  <div className="linked-customers">
                    <h4>Linked Customers ({clients.length})</h4>
                    <div className="customers-list">
                      {clients.map((client) => (
                        <div key={client.id} className="customer-item">
                          <span className="customer-name">{client.firstName} {client.lastName}</span>
                          {client.phone && <span className="customer-phone">📞 {client.phone}</span>}
                          <span className={`status-badge ${getStatusBadgeClass(client.status)}`}>
                            {client.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'balance' && (
              <div className="balance-tab">
                <div className="tab-header">
                  <h3>Shop Balance Information</h3>
                  <p>Detailed financial balance and transaction information for this shop</p>
                </div>

                <div className="balance-placeholder">
                  <div className="placeholder-icon">💰</div>
                  <h4>Balance Information Coming Soon</h4>
                  <p>This section will contain detailed balance information, transaction history, and financial analytics for the shop.</p>
                  
                  <div className="placeholder-features">
                    <div className="feature-item">📊 Total Balance Overview</div>
                    <div className="feature-item">📈 Transaction History</div>
                    <div className="feature-item">💳 Payment Analytics</div>
                    <div className="feature-item">📋 Financial Reports</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetails;
