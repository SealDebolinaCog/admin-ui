import React, { useState, useEffect } from 'react';
import './ClientForm.css';

// Client interfaces (matching backend)
interface PhoneNumber {
  id: string;
  countryCode: string;
  number: string;
  type: 'primary' | 'secondary' | 'work' | 'home';
  isVerified: boolean;
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

interface ClientFormData {
  // Full name
  firstName: string;
  middleName?: string;
  lastName: string;
  
  // Address
  address: Address;
  
  // KYC and contact
  kycNumber: string;
  email?: string;
  phoneNumbers: PhoneNumber[];
  
  // Identity documents
  panCard?: PANCard;
  aadhaarCard?: AadhaarCard;
  otherDocuments: Document[];
  
  // Client relationships
  linkedClients: LinkedClient[];
  
  // Account information
  status: 'invite_now' | 'pending' | 'active' | 'suspended' | 'deleted';
  accountBalance?: number;
}

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: ClientFormData) => void;
  initialData?: Partial<ClientFormData>;
  mode: 'add' | 'edit';
}

// Indian states and districts data
const INDIAN_STATES = [
  { state: 'Maharashtra', districts: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Sangli'] },
  { state: 'Karnataka', districts: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Shimoga', 'Tumkur'] },
  { state: 'Tamil Nadu', districts: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore'] },
  { state: 'Gujarat', districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand'] },
  { state: 'Rajasthan', districts: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Alwar', 'Bharatpur'] },
  { state: 'Uttar Pradesh', districts: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Allahabad', 'Bareilly'] },
  { state: 'West Bengal', districts: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur'] },
  { state: 'Delhi', districts: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi'] }
];

const PHONE_TYPES = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'work', label: 'Work' },
  { value: 'home', label: 'Home' }
];

const RELATIONSHIP_TYPES = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'business_partner', label: 'Business Partner' },
  { value: 'guarantor', label: 'Guarantor' },
  { value: 'other', label: 'Other' }
];

const CLIENT_STATUSES = [
  { value: 'invite_now', label: 'Invite Now' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deleted', label: 'Deleted' }
];

const ClientForm: React.FC<ClientFormProps> = ({ isOpen, onClose, onSubmit, initialData, mode }) => {
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    address: {
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      state: '',
      district: '',
      pincode: '',
      country: 'India'
    },
    kycNumber: '',
    email: '',
    phoneNumbers: [{
      id: 'phone-1',
      countryCode: '+91',
      number: '',
      type: 'primary',
      isVerified: false
    }],
    panCard: {
      number: '',
      verificationStatus: 'pending'
    },
    aadhaarCard: {
      number: '',
      verificationStatus: 'pending'
    },
    otherDocuments: [],
    linkedClients: [],
    status: 'invite_now',
    accountBalance: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Update districts when state changes
  useEffect(() => {
    const selectedState = INDIAN_STATES.find(s => s.state === formData.address.state);
    setAvailableDistricts(selectedState ? selectedState.districts : []);
    if (selectedState && !selectedState.districts.includes(formData.address.district)) {
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, district: '' }
      }));
    }
  }, [formData.address.state]);

  // Validation functions
  const validatePAN = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const validateAadhaar = (aadhaar: string): boolean => {
    // Allow both full and masked format
    const aadhaarRegex = /^(\d{4}\s?\d{4}\s?\d{4}|XXXX-XXXX-\d{4})$/;
    return aadhaarRegex.test(aadhaar.replace(/\s/g, ''));
  };

  const validatePincode = (pincode: string): boolean => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Form handlers
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handlePhoneChange = (index: number, field: keyof PhoneNumber, value: any) => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.map((phone, i) => 
        i === index ? { ...phone, [field]: value } : phone
      )
    }));
  };

  const addPhoneNumber = () => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, {
        id: `phone-${prev.phoneNumbers.length + 1}`,
        countryCode: '+91',
        number: '',
        type: 'secondary',
        isVerified: false
      }]
    }));
  };

  const removePhoneNumber = (index: number) => {
    if (formData.phoneNumbers.length > 1) {
      setFormData(prev => ({
        ...prev,
        phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.kycNumber.trim()) newErrors.kycNumber = 'KYC number is required';
    
    // Address validation
    if (!formData.address.addressLine1.trim()) newErrors.addressLine1 = 'Address line 1 is required';
    if (!formData.address.state) newErrors.state = 'State is required';
    if (!formData.address.district) newErrors.district = 'District is required';
    if (!formData.address.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!validatePincode(formData.address.pincode)) {
      newErrors.pincode = 'Invalid pincode format';
    }

    // Phone validation
    formData.phoneNumbers.forEach((phone, index) => {
      if (!phone.number.trim()) {
        newErrors[`phone-${index}`] = 'Phone number is required';
      } else if (!validatePhone(phone.number)) {
        newErrors[`phone-${index}`] = 'Invalid phone number format';
      }
    });

    // Email validation (if provided)
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // PAN validation (if provided)
    if (formData.panCard?.number && !validatePAN(formData.panCard.number)) {
      newErrors.panCard = 'Invalid PAN format (ABCDE1234F)';
    }

    // Aadhaar validation (if provided)
    if (formData.aadhaarCard?.number && !validateAadhaar(formData.aadhaarCard.number)) {
      newErrors.aadhaarCard = 'Invalid Aadhaar format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="client-form-overlay">
      <div className="client-form-modal">
        <div className="client-form-header">
          <h2>{mode === 'add' ? 'Add New Client' : 'Edit Client'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="form-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <span>1</span> Personal Info
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            <span>2</span> Address & Contact
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <span>3</span> KYC Documents
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
            <span>4</span> Account & Links
          </div>
        </div>

        <form onSubmit={handleSubmit} className="client-form">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Personal Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName ? 'error' : ''}
                  />
                  {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="middleName">Middle Name</label>
                  <input
                    type="text"
                    id="middleName"
                    value={formData.middleName || ''}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? 'error' : ''}
                  />
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="kycNumber">KYC Number *</label>
                  <input
                    type="text"
                    id="kycNumber"
                    value={formData.kycNumber}
                    onChange={(e) => handleInputChange('kycNumber', e.target.value)}
                    className={errors.kycNumber ? 'error' : ''}
                    placeholder="KYC202400001"
                  />
                  {errors.kycNumber && <span className="error-text">{errors.kycNumber}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'error' : ''}
                    placeholder="client@example.com"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    {CLIENT_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address & Contact */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Address & Contact Information</h3>
              
              <div className="form-section">
                <h4>Address</h4>
                <div className="form-group">
                  <label htmlFor="addressLine1">Address Line 1 *</label>
                  <input
                    type="text"
                    id="addressLine1"
                    value={formData.address.addressLine1}
                    onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                    className={errors.addressLine1 ? 'error' : ''}
                    placeholder="123, MG Road"
                  />
                  {errors.addressLine1 && <span className="error-text">{errors.addressLine1}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="addressLine2">Address Line 2</label>
                    <input
                      type="text"
                      id="addressLine2"
                      value={formData.address.addressLine2 || ''}
                      onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                      placeholder="Near Temple"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="addressLine3">Address Line 3</label>
                    <input
                      type="text"
                      id="addressLine3"
                      value={formData.address.addressLine3 || ''}
                      onChange={(e) => handleAddressChange('addressLine3', e.target.value)}
                      placeholder="Sector 5"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <select
                      id="state"
                      value={formData.address.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      className={errors.state ? 'error' : ''}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state.state} value={state.state}>
                          {state.state}
                        </option>
                      ))}
                    </select>
                    {errors.state && <span className="error-text">{errors.state}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="district">District *</label>
                    <select
                      id="district"
                      value={formData.address.district}
                      onChange={(e) => handleAddressChange('district', e.target.value)}
                      className={errors.district ? 'error' : ''}
                      disabled={!formData.address.state}
                    >
                      <option value="">Select District</option>
                      {availableDistricts.map(district => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                    {errors.district && <span className="error-text">{errors.district}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="pincode">Pincode *</label>
                    <input
                      type="text"
                      id="pincode"
                      value={formData.address.pincode}
                      onChange={(e) => handleAddressChange('pincode', e.target.value)}
                      className={errors.pincode ? 'error' : ''}
                      placeholder="400001"
                      maxLength={6}
                    />
                    {errors.pincode && <span className="error-text">{errors.pincode}</span>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Phone Numbers</h4>
                {formData.phoneNumbers.map((phone, index) => (
                  <div key={phone.id} className="phone-entry">
                    <div className="form-row">
                      <div className="form-group small">
                        <label>Country Code</label>
                        <input
                          type="text"
                          value={phone.countryCode}
                          onChange={(e) => handlePhoneChange(index, 'countryCode', e.target.value)}
                          readOnly
                        />
                      </div>

                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                          type="text"
                          value={phone.number}
                          onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                          className={errors[`phone-${index}`] ? 'error' : ''}
                          placeholder="9876543210"
                          maxLength={10}
                        />
                        {errors[`phone-${index}`] && <span className="error-text">{errors[`phone-${index}`]}</span>}
                      </div>

                      <div className="form-group">
                        <label>Type</label>
                        <select
                          value={phone.type}
                          onChange={(e) => handlePhoneChange(index, 'type', e.target.value)}
                        >
                          {PHONE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.phoneNumbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhoneNumber(index)}
                          className="remove-phone-btn"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addPhoneNumber}
                  className="add-phone-btn"
                >
                  + Add Phone Number
                </button>
              </div>
            </div>
          )}

          {/* Step 3: KYC Documents */}
          {currentStep === 3 && (
            <div className="form-step">
              <h3>KYC Documents</h3>
              
              <div className="form-section">
                <h4>PAN Card</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="panNumber">PAN Number</label>
                    <input
                      type="text"
                      id="panNumber"
                      value={formData.panCard?.number || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        panCard: { ...prev.panCard!, number: e.target.value.toUpperCase() }
                      }))}
                      className={errors.panCard ? 'error' : ''}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                    {errors.panCard && <span className="error-text">{errors.panCard}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="panImage">PAN Card Image</label>
                    <input
                      type="file"
                      id="panImage"
                      accept="image/*"
                      onChange={(e) => {
                        // Handle file upload
                        console.log('PAN file selected:', e.target.files?.[0]);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Aadhaar Card</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="aadhaarNumber">Aadhaar Number</label>
                    <input
                      type="text"
                      id="aadhaarNumber"
                      value={formData.aadhaarCard?.number || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        aadhaarCard: { ...prev.aadhaarCard!, number: e.target.value }
                      }))}
                      className={errors.aadhaarCard ? 'error' : ''}
                      placeholder="1234 5678 9012 or XXXX-XXXX-1234"
                    />
                    {errors.aadhaarCard && <span className="error-text">{errors.aadhaarCard}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="aadhaarImage">Aadhaar Card Image</label>
                    <input
                      type="file"
                      id="aadhaarImage"
                      accept="image/*"
                      onChange={(e) => {
                        // Handle file upload
                        console.log('Aadhaar file selected:', e.target.files?.[0]);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Account & Links */}
          {currentStep === 4 && (
            <div className="form-step">
              <h3>Account & Relationships</h3>
              
              <div className="form-section">
                <h4>Account Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="accountBalance">Account Balance (₹)</label>
                    <input
                      type="number"
                      id="accountBalance"
                      value={formData.accountBalance || 0}
                      onChange={(e) => handleInputChange('accountBalance', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Linked Clients</h4>
                <p className="section-description">
                  Link this client to other existing clients (family members, business partners, etc.)
                </p>
                {/* Linked clients functionality can be expanded */}
                <button
                  type="button"
                  className="add-link-btn"
                  onClick={() => {
                    // Add linked client functionality
                    console.log('Add linked client');
                  }}
                >
                  + Add Linked Client
                </button>
              </div>
            </div>
          )}

          <div className="form-actions">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="btn-secondary">
                Previous
              </button>
            )}
            
            {currentStep < 4 ? (
              <button type="button" onClick={nextStep} className="btn-primary">
                Next
              </button>
            ) : (
              <button type="submit" className="btn-primary">
                {mode === 'add' ? 'Create Client' : 'Update Client'}
              </button>
            )}
            
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
