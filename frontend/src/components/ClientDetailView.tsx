import React, { useState } from 'react';
import './ClientDetailView.css';

// Client interfaces (matching backend)
interface PhoneNumber {
  id: string;
  countryCode: string;
  number: string;
  type: 'primary' | 'secondary' | 'work' | 'home';
  isVerified: boolean;
}

interface EmailAddress {
  id: string;
  email: string;
  priority: 'primary' | 'secondary';
  isVerified: boolean;
}

interface Contact {
  id: string;
  type: 'email' | 'phone';
  contactPriority: 'primary' | 'secondary';
  contactDetails: string;
  isVerified?: boolean;
}

interface Address {
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  state: string;
  district: string;
  pincode: string;
  country: string;
}

interface PANCard {
  number: string;
  imageUrl?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
}

interface AadhaarCard {
  number: string;
  imageUrl?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
}

interface Document {
  id: string;
  title: string;
  type: 'pan_card' | 'aadhaar_card' | 'passport' | 'driving_license' | 'voter_id' | 'other';
  number?: string;
  imageUrl?: string;
  uploadedAt: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

interface LinkedClient {
  clientId: number;
  relationshipType: 'spouse' | 'parent' | 'child' | 'sibling' | 'business_partner' | 'guarantor' | 'other';
  relationshipDescription?: string;
  linkedAt: string;
}

interface ClientDetailData {
  id: number;
  clientId: string;
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  address: Address;
  kycNumber: string;
  email?: string;
  phoneNumbers: PhoneNumber[];
  emails?: EmailAddress[];
  contacts?: Contact[];
  linkedClientId?: number;
  linkedClientName?: string;
  panCard?: PANCard;
  aadhaarCard?: AadhaarCard;
  otherDocuments: Document[];
  linkedClients: LinkedClient[];
  status: 'invite_now' | 'pending' | 'active' | 'suspended' | 'deleted';
  accountBalance?: number;
  createdAt: string;
  updatedAt: string;
  addedAt: string;
  lastModifiedAt: string;
  profilePicture?: string;
  joinDate?: string;
  lastLogin?: string;
}

interface ClientDetailViewProps {
  client: ClientDetailData;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const ClientDetailView: React.FC<ClientDetailViewProps> = ({ client, isOpen, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'activity' | 'relationships'>('profile');

  if (!isOpen) return null;

  const getFullName = () => {
    const parts = [];
    if (client.title) parts.push(client.title);
    parts.push(client.firstName);
    if (client.middleName) parts.push(client.middleName);
    parts.push(client.lastName);
    return parts.join(' ');
  };

  const getInitials = () => {
    const firstInitial = client.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = client.lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'invite_now': return '#3b82f6';
      case 'suspended': return '#ef4444';
      case 'deleted': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'pending': return '🟡';
      case 'invite_now': return '📧';
      case 'suspended': return '🔴';
      case 'deleted': return '⚫';
      default: return '⚪';
    }
  };

  const getVerificationIcon = (status: 'pending' | 'verified' | 'rejected') => {
    switch (status) {
      case 'verified': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '⏳';
    }
  };

  const formatPhoneType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatRelationshipType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="client-detail-overlay">
      <div className="client-detail-modal">
        {/* Header */}
        <div className="client-detail-header">
          <div className="client-header-info">
            <div className="client-avatar-large">
              {client.profilePicture ? (
                <img src={client.profilePicture} alt={getFullName()} />
              ) : (
                <span className="avatar-initials-large">{getInitials()}</span>
              )}
            </div>
            <div className="client-header-details">
              <h2>{getFullName()}</h2>
              <p className="client-id">ID: {client.clientId}</p>
              <div className="client-status-badge" style={{ backgroundColor: getStatusColor(client.status) }}>
                {getStatusIcon(client.status)} {client.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>
          <div className="client-header-actions">
            <button className="btn-edit" onClick={onEdit}>
              ✏️ Edit Client
            </button>
            <button className="btn-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="client-detail-tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button
            className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            📄 Documents
          </button>
          <button
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            📊 Activity
          </button>
          <button
            className={`tab ${activeTab === 'relationships' ? 'active' : ''}`}
            onClick={() => setActiveTab('relationships')}
          >
            👥 Relationships
          </button>
        </div>

        {/* Content */}
        <div className="client-detail-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="profile-sections">
                {/* Personal Information */}
                <div className="profile-section">
                  <h3>Personal Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Full Name</label>
                      <span>{getFullName()}</span>
                    </div>
                    <div className="info-item">
                      <label>Gender</label>
                      <span>{client.gender || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Date of Birth</label>
                      <span>{client.dateOfBirth ? formatDate(client.dateOfBirth) : 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Occupation</label>
                      <span>{client.occupation || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>KYC/CIF Number</label>
                      <span>{client.kycNumber}</span>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <span>{client.email || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Account Balance</label>
                      <span className="balance">{formatCurrency(client.accountBalance)}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="profile-section">
                  <h3>Contact Information</h3>
                  
                  {/* Email Addresses */}
                  <div className="contact-subsection">
                    <h4>📧 Email Addresses</h4>
                    {client.contacts && client.contacts.filter(contact => contact.type === 'email').length > 0 ? (
                      <div className="contact-list">
                        {client.contacts
                          .filter(contact => contact.type === 'email')
                          .map((email, index) => (
                          <div key={email.id || index} className="contact-item">
                            <div className="contact-details">
                              <span className="contact-value">{email.contactDetails}</span>
                              <span className="contact-priority">
                                {email.contactPriority === 'primary' ? '🔵 Primary' : '⚪ Secondary'}
                              </span>
                            </div>
                            <div className="contact-status">
                              {email.isVerified ? '✅ Verified' : '⏳ Pending'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-contact">
                        <span>No email addresses available</span>
                      </div>
                    )}
                  </div>

                  {/* Phone Numbers */}
                  <div className="contact-subsection">
                    <h4>📱 Phone Numbers</h4>
                    {client.contacts && client.contacts.filter(contact => contact.type === 'phone').length > 0 ? (
                      <div className="contact-list">
                        {client.contacts
                          .filter(contact => contact.type === 'phone')
                          .map((phone, index) => (
                          <div key={phone.id || index} className="contact-item">
                            <div className="contact-details">
                              <span className="contact-value">{phone.contactDetails}</span>
                              <span className="contact-priority">
                                {phone.contactPriority === 'primary' ? '🔵 Primary' : '⚪ Secondary'}
                              </span>
                            </div>
                            <div className="contact-status">
                              {phone.isVerified ? '✅ Verified' : '⏳ Pending'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-contact">
                        <span>No phone numbers available</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Information */}
                <div className="profile-section">
                  <h3>Address</h3>
                  <div className="address-display">
                    <p>{client.address.addressLine1}</p>
                    {client.address.addressLine2 && <p>{client.address.addressLine2}</p>}
                    {client.address.addressLine3 && <p>{client.address.addressLine3}</p>}
                    <p>{client.address.district}, {client.address.state} - {client.address.pincode}</p>
                    <p>{client.address.country}</p>
                  </div>
                </div>

                {/* Account Information */}
                <div className="profile-section">
                  <h3>Account Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Join Date</label>
                      <span>{client.joinDate ? formatDate(client.joinDate) : 'Not available'}</span>
                    </div>
                    <div className="info-item">
                      <label>Last Login</label>
                      <span>{client.lastLogin ? formatDate(client.lastLogin) : 'Never'}</span>
                    </div>
                    <div className="info-item">
                      <label>Created At</label>
                      <span>{formatDate(client.createdAt)}</span>
                    </div>
                    <div className="info-item">
                      <label>Last Modified</label>
                      <span>{formatDate(client.lastModifiedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="tab-content">
              <div className="documents-sections">
                {/* PAN Card */}
                {client.panCard && (
                  <div className="document-section">
                    <h3>PAN Card</h3>
                    <div className="document-card">
                      <div className="document-info">
                        <div className="document-number">
                          <label>PAN Number</label>
                          <span>{client.panCard.number}</span>
                        </div>
                        <div className="document-status">
                          <label>Status</label>
                          <span className="status-badge">
                            {getVerificationIcon(client.panCard.verificationStatus)} 
                            {client.panCard.verificationStatus.charAt(0).toUpperCase() + client.panCard.verificationStatus.slice(1)}
                          </span>
                        </div>
                      </div>
                      {client.panCard.verifiedAt && (
                        <div className="verification-date">
                          Verified on: {formatDate(client.panCard.verifiedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Aadhaar Card */}
                {client.aadhaarCard && (
                  <div className="document-section">
                    <h3>Aadhaar Card</h3>
                    <div className="document-card">
                      <div className="document-info">
                        <div className="document-number">
                          <label>Aadhaar Number</label>
                          <span>{client.aadhaarCard.number}</span>
                        </div>
                        <div className="document-status">
                          <label>Status</label>
                          <span className="status-badge">
                            {getVerificationIcon(client.aadhaarCard.verificationStatus)} 
                            {client.aadhaarCard.verificationStatus.charAt(0).toUpperCase() + client.aadhaarCard.verificationStatus.slice(1)}
                          </span>
                        </div>
                      </div>
                      {client.aadhaarCard.verifiedAt && (
                        <div className="verification-date">
                          Verified on: {formatDate(client.aadhaarCard.verifiedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Other Documents */}
                {client.otherDocuments.length > 0 && (
                  <div className="document-section">
                    <h3>Other Documents</h3>
                    <div className="documents-list">
                      {client.otherDocuments.map((doc) => (
                        <div key={doc.id} className="document-card">
                          <div className="document-info">
                            <div className="document-title">
                              <label>Document</label>
                              <span>{doc.title}</span>
                            </div>
                            <div className="document-type">
                              <label>Type</label>
                              <span>{formatRelationshipType(doc.type)}</span>
                            </div>
                            {doc.number && (
                              <div className="document-number">
                                <label>Number</label>
                                <span>{doc.number}</span>
                              </div>
                            )}
                            <div className="document-status">
                              <label>Status</label>
                              <span className="status-badge">
                                {getVerificationIcon(doc.verificationStatus)} 
                                {doc.verificationStatus.charAt(0).toUpperCase() + doc.verificationStatus.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className="upload-date">
                            Uploaded on: {formatDate(doc.uploadedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!client.panCard && !client.aadhaarCard && client.otherDocuments.length === 0 && (
                  <div className="empty-documents">
                    <div className="empty-icon">📄</div>
                    <h3>No Documents Available</h3>
                    <p>No KYC documents have been uploaded for this client yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="tab-content">
              <div className="activity-sections">
                <div className="activity-summary">
                  <h3>Account Summary</h3>
                  <div className="summary-cards">
                    <div className="summary-card">
                      <div className="summary-value">{formatCurrency(client.accountBalance)}</div>
                      <div className="summary-label">Current Balance</div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-value">{client.status.replace('_', ' ').toUpperCase()}</div>
                      <div className="summary-label">Account Status</div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-value">
                        {client.phoneNumbers.filter(p => p.isVerified).length}/{client.phoneNumbers.length}
                      </div>
                      <div className="summary-label">Verified Contacts</div>
                    </div>
                  </div>
                </div>

                <div className="activity-timeline">
                  <h3>Recent Activity</h3>
                  <div className="timeline">
                    <div className="timeline-item">
                      <div className="timeline-date">{formatDate(client.lastModifiedAt)}</div>
                      <div className="timeline-content">
                        <h4>Profile Updated</h4>
                        <p>Client information was last modified</p>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-date">{formatDate(client.createdAt)}</div>
                      <div className="timeline-content">
                        <h4>Account Created</h4>
                        <p>Client account was created in the system</p>
                      </div>
                    </div>
                    {client.lastLogin && (
                      <div className="timeline-item">
                        <div className="timeline-date">{formatDate(client.lastLogin)}</div>
                        <div className="timeline-content">
                          <h4>Last Login</h4>
                          <p>Client last accessed their account</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Relationships Tab */}
          {activeTab === 'relationships' && (
            <div className="tab-content">
              <div className="relationships-sections">
                {/* Primary Linked Client */}
                {client.linkedClientId && (
                  <div className="profile-section">
                    <h3>🔗 Primary Linked Client</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Linked Client Name</label>
                        <span>{client.linkedClientName || `Client ID: ${client.linkedClientId}`}</span>
                      </div>
                      <div className="info-item">
                        <label>Linked Client ID</label>
                        <span>{client.linkedClientId}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Additional Linked Clients */}
                <div className="profile-section">
                  <h3>👥 Additional Relationships</h3>
                  {client.linkedClients.length > 0 ? (
                    <div className="relationships-list">
                      {client.linkedClients.map((link, index) => (
                        <div key={index} className="relationship-card">
                          <div className="relationship-info">
                            <div className="relationship-type">
                              <label>Relationship</label>
                              <span>{formatRelationshipType(link.relationshipType)}</span>
                            </div>
                            <div className="relationship-client">
                              <label>Client ID</label>
                              <span>{link.clientId}</span>
                            </div>
                            {link.relationshipDescription && (
                              <div className="relationship-description">
                                <label>Description</label>
                                <span>{link.relationshipDescription}</span>
                              </div>
                            )}
                          </div>
                          <div className="relationship-date">
                            Linked on: {formatDate(link.linkedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-relationships">
                      <div className="empty-icon">👥</div>
                      <h3>No Additional Relationships</h3>
                      <p>This client has no additional linked relationships with other clients.</p>
                    </div>
                  )}
                </div>
                
                {!client.linkedClientId && client.linkedClients.length === 0 && (
                  <div className="empty-relationships">
                    <div className="empty-icon">👥</div>
                    <h3>No Linked Clients</h3>
                    <p>This client has no linked relationships with other clients.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailView;
