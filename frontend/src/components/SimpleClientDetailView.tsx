import React, { useState } from 'react';
import './ShopForm.css';

interface SimpleClient {
  id: number;
  title?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  email?: string;
  phone?: string;
  contacts?: {
    id: string;
    type: 'email' | 'phone';
    contactPriority: 'primary' | 'secondary';
    contactDetails: string;
    isVerified?: boolean;
  }[];
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
  linkedClientId?: number;
  linkedClientName?: string;
  linkedClientRelationship?: string;
  allLinkedClients?: {
    id: number;
    name: string;
    relationshipType: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

interface SimpleClientDetailViewProps {
  client: SimpleClient;
  onClose: () => void;
  onEdit: () => void;
}

interface DocumentLoadingState {
  [key: string]: boolean;
}

const SimpleClientDetailView: React.FC<SimpleClientDetailViewProps> = ({ client, onClose, onEdit }) => {
  const [documentLoading, setDocumentLoading] = useState<DocumentLoadingState>({});
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const getFullName = () => {
    const parts = [];
    if (client.title) parts.push(client.title);
    parts.push(client.firstName);
    parts.push(client.lastName);
    return parts.join(' ');
  };

  const getInitials = () => {
    const firstInitial = client.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = client.lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const formatRelationshipType = (type: string) => {
    const relationshipMap: { [key: string]: string } = {
      'primary_link': 'Primary Link',
      'reverse_link': 'Linked To This Client',
      'spouse': 'Spouse',
      'parent': 'Parent',
      'child': 'Child',
      'sibling': 'Sibling',
      'business_partner': 'Business Partner',
      'guarantor': 'Guarantor',
      'other': 'Other'
    };
    return relationshipMap[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDocumentDownload = async (documentType: 'pan' | 'aadhaar', clientId?: number) => {
    const loadingKey = `${documentType}-download-${clientId}`;
    setDocumentLoading(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      const docType = documentType === 'pan' ? 'pan_card' : 'aadhar_card';
      const response = await fetch(`http://localhost:3002/api/documents/entity/client/${clientId}/type/${docType}/download`, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('Download response status:', response.status);
      console.log('Download response headers:', response.headers);
      
      if (response.ok) {
        const blob = await response.blob();
        console.log('Download blob size:', blob.size);
        console.log('Download blob type:', blob.type);
        
        if (blob.size === 0) {
          showNotification(`${documentType.toUpperCase()} document is empty`, 'error');
          return;
        }
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fullName = getFullName().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const docType = documentType === 'pan' ? 'PAN_Card' : 'Aadhaar_Card';
        link.download = `${fullName}_${docType}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showNotification(`${documentType.toUpperCase()} document downloaded successfully!`, 'success');
      } else {
        console.error('Download failed with status:', response.status);
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Download error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        const errorMessage = errorData.error || `Failed to download ${documentType.toUpperCase()} document (Status: ${response.status})`;
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error(`Error downloading ${documentType} document:`, error);
      showNotification(`Network error while downloading ${documentType.toUpperCase()} document. Please check your connection and try again.`, 'error');
    } finally {
      setDocumentLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleDocumentView = async (documentType: 'pan' | 'aadhaar', clientId?: number) => {
    const loadingKey = `${documentType}-view-${clientId}`;
    setDocumentLoading(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      const docType = documentType === 'pan' ? 'pan_card' : 'aadhar_card';
      const response = await fetch(`http://localhost:3002/api/documents/entity/client/${clientId}/type/${docType}/view`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf,application/octet-stream',
        },
        credentials: 'include',
      });
      
      console.log('View response status:', response.status);
      console.log('View response headers:', response.headers);
      
      if (response.ok) {
        const blob = await response.blob();
        console.log('View blob size:', blob.size);
        console.log('View blob type:', blob.type);
        
        if (blob.size === 0) {
          showNotification(`${documentType.toUpperCase()} document is empty`, 'error');
          return;
        }
        
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Clean up the URL after a delay to allow the browser to load it
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        showNotification(`${documentType.toUpperCase()} document opened in new tab!`, 'success');
      } else {
        console.error('View failed with status:', response.status);
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('View error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        const errorMessage = errorData.error || `Failed to view ${documentType.toUpperCase()} document (Status: ${response.status})`;
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error(`Error viewing ${documentType} document:`, error);
      showNotification(`Network error while viewing ${documentType.toUpperCase()} document. Please check your connection and try again.`, 'error');
    } finally {
      setDocumentLoading(prev => ({ ...prev, [loadingKey]: false }));
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content client-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>👤 Client Details</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        {/* Notification Toast */}
        {notification && (
          <div className={`notification-toast ${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
        )}
        
        <div className="shop-form" style={{ padding: '32px' }}>
          <div className="form-section">
            <h4>Personal Information</h4>
            <div className="detail-row">
              <span className="detail-label">Full Name:</span>
              <span className="detail-value">{getFullName()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Gender:</span>
              <span className="detail-value">{client.gender || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date of Birth:</span>
              <span className="detail-value">{client.dateOfBirth ? formatDate(client.dateOfBirth) : 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Occupation:</span>
              <span className="detail-value">{client.occupation || 'Not provided'}</span>
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
            <h4>Contact Information</h4>
            
            {/* Email Addresses */}
            <div className="detail-subsection">
              <h5>📧 Email Addresses</h5>
              {client.contacts && client.contacts.filter(contact => contact.type === 'email').length > 0 ? (
                client.contacts
                  .filter(contact => contact.type === 'email')
                  .map((email, index) => (
                    <div key={email.id || index} className="detail-row">
                      <span className="detail-label">{email.contactDetails}:</span>
                      <span className="detail-value">
                        {email.contactPriority === 'primary' ? '🔵 Primary' : '⚪ Secondary'}
                        {email.isVerified ? ' ✅' : ' ⏳'}
                      </span>
                    </div>
                  ))
              ) : (
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{client.email || 'Not provided'}</span>
                </div>
              )}
            </div>

            {/* Phone Numbers */}
            <div className="detail-subsection">
              <h5>📱 Phone Numbers</h5>
              {client.contacts && client.contacts.filter(contact => contact.type === 'phone').length > 0 ? (
                client.contacts
                  .filter(contact => contact.type === 'phone')
                  .map((phone, index) => (
                    <div key={phone.id || index} className="detail-row">
                      <span className="detail-label">{phone.contactDetails}:</span>
                      <span className="detail-value">
                        {phone.contactPriority === 'primary' ? '🔵 Primary' : '⚪ Secondary'}
                        {phone.isVerified ? ' ✅' : ' ⏳'}
                      </span>
                    </div>
                  ))
              ) : (
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{client.phone || 'Not provided'}</span>
                </div>
              )}
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
          <div className="form-section">
            <h4>🔗 Linked Clients</h4>
            {client.allLinkedClients && client.allLinkedClients.length > 0 ? (
              <div className="linked-clients-list">
                {client.allLinkedClients.map((linkedClient, index) => (
                  <div key={`${linkedClient.id}-${index}`} className="linked-client-card">
                    <div className="linked-client-header">
                      <span className="relationship-badge">
                        {formatRelationshipType(linkedClient.relationshipType)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{linkedClient.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Relationship:</span>
                      <span className="detail-value">{formatRelationshipType(linkedClient.relationshipType)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : client.linkedClientId ? (
              <div className="linked-client-card">
                <div className="linked-client-header">
                  <span className="relationship-badge">
                    {client.linkedClientRelationship ? 
                      formatRelationshipType(client.linkedClientRelationship) : 
                      'Related Client'
                    }
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">
                    {client.linkedClientName || `Client ID: ${client.linkedClientId}`}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Relationship:</span>
                  <span className="detail-value">
                    {client.linkedClientRelationship ? 
                      formatRelationshipType(client.linkedClientRelationship) : 
                      'Related Client'
                    }
                  </span>
                </div>
              </div>
            ) : (
              <div className="no-linked-clients">
                <span className="empty-state">👥 No linked clients</span>
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="form-section">
            <h4>📄 Documents</h4>
            <div className="documents-grid">
              {/* PAN Card */}
              <div className="document-card">
                <div className="document-header">
                  <span className="document-icon">🆔</span>
                  <span className="document-title">PAN Card</span>
                </div>
                <div className="document-info">
                  {client.panNumber ? (
                    <>
                      <div className="document-number">
                        <span className="detail-label">Number:</span>
                        <span className="detail-value">{client.panNumber}</span>
                      </div>
                      <div className="document-actions">
                        <button 
                          type="button" 
                          className="btn-download"
                          onClick={() => handleDocumentDownload('pan', client.id)}
                          disabled={documentLoading[`pan-download-${client.id}`]}
                          title="Download PAN Card"
                        >
                          {documentLoading[`pan-download-${client.id}`] ? '⏳ Downloading...' : '📥 Download'}
                        </button>
                        <button 
                          type="button" 
                          className="btn-view"
                          onClick={() => handleDocumentView('pan', client.id)}
                          disabled={documentLoading[`pan-view-${client.id}`]}
                          title="View PAN Card"
                        >
                          {documentLoading[`pan-view-${client.id}`] ? '⏳ Loading...' : '👁️ View'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="no-document">
                      <span className="empty-state">No PAN card uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Aadhaar Card */}
              <div className="document-card">
                <div className="document-header">
                  <span className="document-icon">🪪</span>
                  <span className="document-title">Aadhaar Card</span>
                </div>
                <div className="document-info">
                  {client.aadhaarNumber ? (
                    <>
                      <div className="document-number">
                        <span className="detail-label">Number:</span>
                        <span className="detail-value">{client.aadhaarNumber}</span>
                      </div>
                      <div className="document-actions">
                        <button 
                          type="button" 
                          className="btn-download"
                          onClick={() => handleDocumentDownload('aadhaar', client.id)}
                          disabled={documentLoading[`aadhaar-download-${client.id}`]}
                          title="Download Aadhaar Card"
                        >
                          {documentLoading[`aadhaar-download-${client.id}`] ? '⏳ Downloading...' : '📥 Download'}
                        </button>
                        <button 
                          type="button" 
                          className="btn-view"
                          onClick={() => handleDocumentView('aadhaar', client.id)}
                          disabled={documentLoading[`aadhaar-view-${client.id}`]}
                          title="View Aadhaar Card"
                        >
                          {documentLoading[`aadhaar-view-${client.id}`] ? '⏳ Loading...' : '👁️ View'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="no-document">
                      <span className="empty-state">No Aadhaar card uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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