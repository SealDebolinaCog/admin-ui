import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClientSearchDropdown from './ClientSearchDropdown';
import './ShopClientManager.css';

interface ShopClient {
  id: number;
  shopId: number;
  clientId: number;
  addedAt: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail?: string;
  clientPhone?: string;
  shopName: string;
}

interface ShopClientManagerProps {
  shopId: number;
  shopName: string;
  isOpen: boolean;
  onClose: () => void;
  onClientsChanged: () => void;
}

const ShopClientManager: React.FC<ShopClientManagerProps> = ({
  shopId,
  shopName,
  isOpen,
  onClose,
  onClientsChanged
}) => {
  const [clients, setClients] = useState<ShopClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current clients for this shop
  useEffect(() => {
    if (isOpen && shopId) {
      fetchShopClients();
    }
  }, [isOpen, shopId]);

  const fetchShopClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/shop-clients/shop/${shopId}`);
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching shop clients:', error);
      setError('Failed to fetch shop clients');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
  };

  const addClientToShop = async () => {
    if (!selectedClient) {
      setError('Please select a client first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/shop-clients', {
        shopId,
        clientId: selectedClient.id,
      });

      if (response.data.success) {
        setSuccessMessage('Client added to shop successfully');
        setSelectedClient(null);
        fetchShopClients();
        onClientsChanged();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Error adding client to shop:', error);
      setError(error.response?.data?.error || 'Failed to add client to shop');
    } finally {
      setLoading(false);
    }
  };

  const removeClientFromShop = async (clientId: number) => {
    if (!window.confirm('Are you sure you want to remove this client from the shop?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.delete(`/api/shop-clients/shop/${shopId}/client/${clientId}`);
      
      if (response.data.success) {
        setSuccessMessage('Client removed from shop successfully');
        fetchShopClients();
        onClientsChanged();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Error removing client from shop:', error);
      setError(error.response?.data?.error || 'Failed to remove client from shop');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="shop-client-manager-overlay">
      <div className="shop-client-manager-modal">
        <div className="shop-client-manager-header">
          <h2>Manage Clients</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="shop-client-manager-content">
          {/* Add New Client Section */}
          <div className="add-client-section">
            <h3>Add New Client</h3>
            <div className="add-client-form">
              <div className="form-group">
                <label>Select Client</label>
                <ClientSearchDropdown
                  value={selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : ''}
                  onChange={() => {}} // Not needed for this use case
                  placeholder="Search for a client..."
                  onClientSelect={handleClientSelect}
                />
              </div>
              
              <button
                className="btn-primary"
                onClick={addClientToShop}
                disabled={!selectedClient || loading}
              >
                {loading ? 'Adding...' : 'Add Client to Shop'}
              </button>
            </div>
          </div>

          {/* Current Clients Section */}
          <div className="current-clients-section">
            <h3>Current Clients ({clients.length})</h3>
            
            {loading && <div className="loading">Loading...</div>}
            
            {error && (
              <div className="error-message">
                {error}
                <button onClick={() => setError(null)}>×</button>
              </div>
            )}
            
            {successMessage && (
              <div className="success-message">
                {successMessage}
                <button onClick={() => setSuccessMessage(null)}>×</button>
              </div>
            )}

            {clients.length === 0 ? (
              <div className="no-clients">
                <p>No clients are currently associated with this shop.</p>
                <p>Use the form above to add your first client.</p>
              </div>
            ) : (
              <div className="clients-list">
                {clients.map((client) => (
                  <div key={client.id} className="client-item">
                    <div className="client-info">
                      <div className="client-name">
                        {client.clientFirstName} {client.clientLastName}
                      </div>
                      <div className="client-details">
                        {client.clientEmail && <span>📧 {client.clientEmail}</span>}
                        {client.clientPhone && <span>📞 {client.clientPhone}</span>}
                      </div>
                    </div>
                    
                    <div className="client-actions">
                      
                      <button
                        className="btn-danger"
                        onClick={() => removeClientFromShop(client.clientId)}
                        disabled={loading}
                        title="Remove client from shop"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="shop-client-manager-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopClientManager; 