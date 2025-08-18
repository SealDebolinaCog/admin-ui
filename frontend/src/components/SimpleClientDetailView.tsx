import React from 'react';
import './UserManagement.css';
import './ShopForm.css';

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
  linkedClientId?: string;
  linkedClientName?: string;
  linkedClientRelationship?: string;
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
    <div className="shop-form-overlay">
      <div className="shop-form-modal">
        <div className="shop-form-header">
          <h2>Client Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="shop-form" style={{ padding: '32px' }}>
          <div className="form-section">
            <h4>Personal Information</h4>
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

          <div className="form-section">
            <h4>KYC & Identity Documents</h4>
            <div className="detail-row">
              <span className="detail-label">KYC/CIF Number:</span>
              <span className="detail-value">{client.kycNumber || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">PAN Number:</span>
              <span className="detail-value">{client.panNumber || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Aadhaar Number:</span>
              <span className="detail-value">{client.aadhaarNumber || 'Not provided'}</span>
            </div>
          </div>

          <div className="form-section">
            <h4>Address Information</h4>
            <div className="detail-row">
              <span className="detail-label">Address:</span>
              <span className="detail-value">{getAddress()}</span>
            </div>
          </div>

          <div className="form-section">
            <h4>Account Information</h4>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value">
                <span className={`status-badge ${client.status}`}>
                  {client.status === 'active' ? '🟢 Active' : 
                   client.status === 'pending' ? '🟡 Pending' :
                   client.status === 'suspended' ? '🟠 Suspended' :
                   client.status === 'deleted' ? '⚫ Deleted' :
                   client.status === 'invite_now' ? '📧 Invite Now' :
                   '⚪ Unknown'}
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

          {/* Linked Client Information */}
          {client.linkedClientId && (
            <div className="form-section">
              <h4>Linked Client</h4>
              <div className="detail-row">
                <span className="detail-label">Linked Client Name:</span>
                <span className="detail-value">{client.linkedClientName || 'N/A'}</span>
              </div>
              {client.linkedClientRelationship && (
                <div className="detail-row">
                  <span className="detail-label">Relationship Type:</span>
                  <span className="detail-value">{client.linkedClientRelationship.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onEdit}
              className="btn-primary"
            >
              ✏️ Edit Client
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="btn-cancel"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleClientDetailView; 