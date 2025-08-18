import React from 'react';
import './UserManagement.css';

interface SimpleClient {
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

interface SimpleClientDetailViewProps {
  client: SimpleClient;
  onClose: () => void;
  onEdit: () => void;
}

const SimpleClientDetailView: React.FC<SimpleClientDetailViewProps> = ({ client, onClose, onEdit }) => {
  const getFullName = () => {
    return `${client.firstName} ${client.lastName}`.trim();
  };

  const getInitials = () => {
    const firstInitial = client.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = client.lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'suspended': return '#ef4444';
      case 'deleted': return '#6b7280';
      case 'pending': return '#f59e0b';
      case 'invite_now': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'suspended': return '🔴';
      case 'deleted': return '⚫';
      case 'pending': return '🟡';
      case 'invite_now': return '📧';
      default: return '⚪';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAddress = () => {
    const parts = [
      client.addressLine1,
      client.addressLine2,
      client.addressLine3,
      client.district,
      client.state,
      client.pincode,
      client.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not provided';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content client-detail-modal">
        <div className="modal-header">
          <div className="client-header">
            <div className="client-avatar-large">
              {getInitials()}
            </div>
            <div className="client-header-info">
              <h2>{getFullName()}</h2>
              <div className="client-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(client.status) }}
                >
                  {getStatusIcon(client.status)} {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="client-details-grid">
            <div className="detail-section">
              <h3>Personal Information</h3>
              <div className="detail-row">
                <span className="detail-label">Full Name:</span>
                <span className="detail-value">{getFullName()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{client.email || 'Not provided'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{client.phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>KYC & Identity Documents</h3>
            </div>

            <div className="detail-section">
              <h3>Address Information</h3>
              <div className="detail-row">
                <span className="detail-label">Full Address:</span>
                <span className="detail-value">{getAddress()}</span>
              </div>
              {client.state && (
                <div className="detail-row">
                  <span className="detail-label">State:</span>
                  <span className="detail-value">{client.state}</span>
                </div>
              )}
              {client.district && (
                <div className="detail-row">
                  <span className="detail-label">District:</span>
                  <span className="detail-value">{client.district}</span>
                </div>
              )}
              {client.pincode && (
                <div className="detail-row">
                  <span className="detail-label">Pincode:</span>
                  <span className="detail-value">{client.pincode}</span>
                </div>
              )}
            </div>

            <div className="detail-section">
              <h3>Account Information</h3>
              <div className="detail-row">
                <span className="detail-label">Client ID:</span>
                <span className="detail-value">#{client.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(client.status) }}
                  >
                    {getStatusIcon(client.status)} {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Created:</span>
                <span className="detail-value">{formatDate(client.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">{formatDate(client.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="edit-btn" onClick={onEdit}>
            ✏️ Edit Client
          </button>
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleClientDetailView; 