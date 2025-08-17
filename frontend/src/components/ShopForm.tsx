import React, { useState, useEffect } from 'react';
import './ShopForm.css';

// Shop interfaces (matching backend structure)
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

interface GSTNumber {
  number: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
}

interface PANCard {
  number: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
}

interface Document {
  id: string;
  title: string;
  type: 'gst_certificate' | 'pan_card' | 'shop_license' | 'trade_license' | 'fire_safety' | 'other';
  number?: string;
  imageUrl?: string;
  uploadedAt: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

interface ShopFormData {
  // Shop details
  shopName: string;
  shopType: 'retail' | 'wholesale' | 'ecommerce' | 'service' | 'restaurant' | 'other';
  category: string;
  description?: string;
  
  // Owner information
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  
  // Address
  address: Address;
  
  // Business information
  gstNumber?: GSTNumber;
  panNumber?: PANCard;
  businessLicenseNumber?: string;
  registrationDate?: string;
  
  // Contact information
  shopPhoneNumbers: PhoneNumber[];
  shopEmail?: string;
  website?: string;
  
  // Financial information
  annualRevenue?: number;
  employeeCount?: number;
  
  // Documents
  documents: Document[];
  
  // Status
  status: 'pending' | 'active' | 'suspended' | 'inactive' | 'verified';
}

interface ShopFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (shopData: ShopFormData) => void;
  initialData?: Partial<ShopFormData>;
  mode: 'add' | 'edit';
}

// Indian states and union territories data (comprehensive list)
const INDIAN_STATES = [
  // States (28)
  { state: 'Andhra Pradesh', districts: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Anantapur'] },
  { state: 'Arunachal Pradesh', districts: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur', 'Bomdila', 'Ziro', 'Along', 'Tezu'] },
  { state: 'Assam', districts: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon'] },
  { state: 'Bihar', districts: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah'] },
  { state: 'Chhattisgarh', districts: ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh'] },
  { state: 'Goa', districts: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim'] },
  { state: 'Gujarat', districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand'] },
  { state: 'Haryana', districts: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal'] },
  { state: 'Himachal Pradesh', districts: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Una', 'Kullu', 'Hamirpur'] },
  { state: 'Jharkhand', districts: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih'] },
  { state: 'Karnataka', districts: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Shimoga', 'Tumkur'] },
  { state: 'Kerala', districts: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kannur'] },
  { state: 'Madhya Pradesh', districts: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna'] },
  { state: 'Maharashtra', districts: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Sangli'] },
  { state: 'Manipur', districts: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul', 'Senapati', 'Tamenglong', 'Chandel'] },
  { state: 'Meghalaya', districts: ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Baghmara', 'Ampati', 'Resubelpara', 'Khliehriat'] },
  { state: 'Mizoram', districts: ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Lawngtlai', 'Mamit'] },
  { state: 'Nagaland', districts: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek', 'Kiphire'] },
  { state: 'Odisha', districts: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Baripada'] },
  { state: 'Punjab', districts: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Firozpur', 'Hoshiarpur'] },
  { state: 'Rajasthan', districts: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Alwar', 'Bharatpur'] },
  { state: 'Sikkim', districts: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Pakyong', 'Soreng', 'Rangpo', 'Singtam'] },
  { state: 'Tamil Nadu', districts: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore'] },
  { state: 'Telangana', districts: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Nalgonda'] },
  { state: 'Tripura', districts: ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailasahar', 'Belonia', 'Khowai', 'Ambassa', 'Santirbazar'] },
  { state: 'Uttar Pradesh', districts: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Allahabad', 'Bareilly'] },
  { state: 'Uttarakhand', districts: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Kotdwar'] },
  { state: 'West Bengal', districts: ['Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman', 'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur'] },
  
  // Union Territories (8)
  { state: 'Andaman and Nicobar Islands', districts: ['Port Blair', 'Car Nicobar', 'Mayabunder', 'Rangat', 'Diglipur', 'Campbell Bay', 'Nancowry', 'Little Andaman'] },
  { state: 'Chandigarh', districts: ['Chandigarh'] },
  { state: 'Dadra and Nagar Haveli and Daman and Diu', districts: ['Daman', 'Diu', 'Silvassa', 'Dadra', 'Nagar Haveli'] },
  { state: 'Delhi', districts: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 'Shahdara'] },
  { state: 'Jammu and Kashmir', districts: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kupwara', 'Pulwama', 'Rajouri', 'Poonch'] },
  { state: 'Ladakh', districts: ['Leh', 'Kargil', 'Nubra', 'Changthang', 'Zanskar', 'Drass'] },
  { state: 'Lakshadweep', districts: ['Kavaratti', 'Agatti', 'Minicoy', 'Amini', 'Andrott', 'Kalpeni', 'Kadmat', 'Kiltan'] },
  { state: 'Puducherry', districts: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'] }
];

const SHOP_TYPES = [
  { value: 'retail', label: 'Retail Store' },
  { value: 'wholesale', label: 'Wholesale Business' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'service', label: 'Service Provider' },
  { value: 'restaurant', label: 'Restaurant/Food' },
  { value: 'other', label: 'Other' }
];

const SHOP_CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing & Fashion' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'beauty', label: 'Beauty & Personal Care' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports & Outdoors' },
  { value: 'books', label: 'Books & Stationery' },
  { value: 'jewelry', label: 'Jewelry & Accessories' },
  { value: 'pharmaceuticals', label: 'Pharmaceuticals' },
  { value: 'hardware', label: 'Hardware & Tools' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'other', label: 'Other' }
];

const PHONE_TYPES = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'work', label: 'Work' },
  { value: 'home', label: 'Home' }
];

const SHOP_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' }
];

const ShopForm: React.FC<ShopFormProps> = ({ isOpen, onClose, onSubmit, initialData, mode }) => {
  const [formData, setFormData] = useState<ShopFormData>({
    shopName: '',
    shopType: 'retail',
    category: 'electronics',
    description: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    address: {
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      state: 'West Bengal',
      district: 'Nadia',
      pincode: '741501',
      country: 'India'
    },
    gstNumber: {
      number: '',
      verificationStatus: 'pending'
    },
    panNumber: {
      number: '',
      verificationStatus: 'pending'
    },
    businessLicenseNumber: '',
    registrationDate: new Date().toISOString().split('T')[0],
    shopPhoneNumbers: [{
      id: 'phone-1',
      countryCode: '+91',
      number: '',
      type: 'primary',
      isVerified: false
    }],
    shopEmail: '',
    website: '',
    annualRevenue: 0,
    employeeCount: 1,
    documents: [],
    status: 'active'
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
    if (selectedState) {
      setAvailableDistricts(selectedState.districts);
      // Reset district if current selection is not valid for new state
      if (!selectedState.districts.includes(formData.address.district)) {
        setFormData(prev => ({
          ...prev,
          address: { ...prev.address, district: selectedState.districts[0] || '' }
        }));
      }
    }
  }, [formData.address.state]);

  // Validation functions
  const validateName = (name: string): { isValid: boolean; error?: string } => {
    if (!name || !name.trim()) {
      return { isValid: false, error: 'Name is required' };
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters long' };
    }
    
    if (name.trim().length > 50) {
      return { isValid: false, error: 'Name must not exceed 50 characters' };
    }
    
    if (!/^[a-zA-Z0-9\s&.,-]+$/.test(name.trim())) {
      return { isValid: false, error: 'Name can only contain letters, numbers, spaces, &, ., comma, and -' };
    }
    
    return { isValid: true };
  };

  const validateGST = (gst: string): boolean => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };

  const validatePAN = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Step 1 validation (Shop Details)
    if (currentStep === 1) {
      if (!formData.shopName || !formData.shopName.trim()) {
        newErrors.shopName = 'Shop name is required';
      } else {
        const shopNameValidation = validateName(formData.shopName);
        if (!shopNameValidation.isValid) {
          newErrors.shopName = shopNameValidation.error || 'Invalid shop name';
        }
      }
    }

    // Step 2 validation (Owner Information)
    if (currentStep === 2) {
      if (!formData.ownerName || !formData.ownerName.trim()) {
        newErrors.ownerName = 'Owner name is required';
      } else {
        const ownerNameValidation = validateName(formData.ownerName);
        if (!ownerNameValidation.isValid) {
          newErrors.ownerName = ownerNameValidation.error || 'Invalid owner name';
        }
      }
      
      if (formData.ownerEmail && !validateEmail(formData.ownerEmail)) newErrors.ownerEmail = 'Invalid email format';
      if (formData.ownerPhone && !validatePhone(formData.ownerPhone)) newErrors.ownerPhone = 'Invalid phone number';
    }

    // Step 3 validation (Address & Contact)
    if (currentStep === 3) {
      if (!formData.address.addressLine1.trim()) newErrors.addressLine1 = 'Address line 1 is required';
      if (!formData.address.state.trim()) newErrors.state = 'State is required';
      if (!formData.address.district.trim()) newErrors.district = 'District is required';
      if (!formData.address.pincode.trim()) newErrors.pincode = 'Pincode is required';
      if (!validatePincode(formData.address.pincode)) newErrors.pincode = 'Invalid pincode format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleShopNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      shopName: value
    }));
    
    // Clear error when user starts typing
    if (errors.shopName) {
      setErrors(prev => ({ ...prev, shopName: '' }));
    }
    
    // Real-time validation
    if (value.trim()) {
      const shopNameValidation = validateName(value);
      if (!shopNameValidation.isValid) {
        setErrors(prev => ({ ...prev, shopName: shopNameValidation.error || 'Invalid shop name' }));
      }
    }
  };

  const handleOwnerNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      ownerName: value
    }));
    
    // Clear error when user starts typing
    if (errors.ownerName) {
      setErrors(prev => ({ ...prev, ownerName: '' }));
    }
    
    // Real-time validation
    if (value.trim()) {
      const ownerNameValidation = validateName(value);
      if (!ownerNameValidation.isValid) {
        setErrors(prev => ({ ...prev, ownerName: ownerNameValidation.error || 'Invalid owner name' }));
      }
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addPhoneNumber = () => {
    const newPhone: PhoneNumber = {
      id: `phone-${Date.now()}`,
      countryCode: '+91',
      number: '',
      type: 'secondary',
      isVerified: false
    };
    setFormData(prev => ({
      ...prev,
      shopPhoneNumbers: [...prev.shopPhoneNumbers, newPhone]
    }));
  };

  const removePhoneNumber = (id: string) => {
    if (formData.shopPhoneNumbers.length > 1) {
      setFormData(prev => ({
        ...prev,
        shopPhoneNumbers: prev.shopPhoneNumbers.filter(phone => phone.id !== id)
      }));
    }
  };

  const updatePhoneNumber = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      shopPhoneNumbers: prev.shopPhoneNumbers.map(phone =>
        phone.id === id ? { ...phone, [field]: value } : phone
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const nextStep = () => {
    if (validateForm()) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="shop-form-overlay">
      <div className="shop-form-modal">
        <div className="shop-form-header">
          <h2>{mode === 'add' ? 'Add New Shop' : 'Edit Shop'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="shop-form-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Shop Details</span>
          </div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Owner Info</span>
          </div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Address & Contact</span>
          </div>
        </div>

        <div className="shop-form">
          {/* Step 1: Shop Details */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Shop Information</h3>
              
              <div className="form-group">
                <label htmlFor="shopName">Shop Name *</label>
                <input
                  type="text"
                  id="shopName"
                  value={formData.shopName}
                  onChange={(e) => handleShopNameChange(e.target.value)}
                  className={errors.shopName ? 'error' : ''}
                  placeholder="Enter shop name"
                />
                {errors.shopName && <span className="error-message">{errors.shopName}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="shopType">Shop Type</label>
                  <select
                    id="shopType"
                    value={formData.shopType}
                    onChange={(e) => handleInputChange('shopType', e.target.value)}
                  >
                    {SHOP_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  >
                    {SHOP_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your shop/business"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  {SHOP_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Owner Information */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Owner Information</h3>
              
              <div className="form-group">
                <label htmlFor="ownerName">Owner Name *</label>
                <input
                  type="text"
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => handleOwnerNameChange(e.target.value)}
                  className={errors.ownerName ? 'error' : ''}
                  placeholder="Enter owner's full name"
                />
                {errors.ownerName && <span className="error-message">{errors.ownerName}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ownerEmail">Owner Email</label>
                  <input
                    type="email"
                    id="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                    className={errors.ownerEmail ? 'error' : ''}
                    placeholder="Enter owner's email"
                  />
                  {errors.ownerEmail && <span className="error-message">{errors.ownerEmail}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="ownerPhone">Owner Phone</label>
                  <input
                    type="tel"
                    id="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                    className={errors.ownerPhone ? 'error' : ''}
                    placeholder="Enter owner's phone number"
                  />
                  {errors.ownerPhone && <span className="error-message">{errors.ownerPhone}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Address & Contact */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit} className="form-step" id="shop-form-step3">
              <h3>Address & Contact Information</h3>
              
              <div className="form-group">
                <label htmlFor="addressLine1">Address Line 1 *</label>
                <input
                  type="text"
                  id="addressLine1"
                  value={formData.address.addressLine1}
                  onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                  className={errors.addressLine1 ? 'error' : ''}
                  placeholder="Street address, building number"
                />
                {errors.addressLine1 && <span className="error-message">{errors.addressLine1}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="addressLine2">Address Line 2</label>
                <input
                  type="text"
                  id="addressLine2"
                  value={formData.address.addressLine2}
                  onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                  placeholder="Apartment, suite, unit, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="addressLine3">Address Line 3</label>
                <input
                  type="text"
                  id="addressLine3"
                  value={formData.address.addressLine3}
                  onChange={(e) => handleAddressChange('addressLine3', e.target.value)}
                  placeholder="Landmark, area, etc."
                />
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
                    {INDIAN_STATES.map(state => (
                      <option key={state.state} value={state.state}>{state.state}</option>
                    ))}
                  </select>
                  {errors.state && <span className="error-message">{errors.state}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="district">District *</label>
                  <select
                    id="district"
                    value={formData.address.district}
                    onChange={(e) => handleAddressChange('district', e.target.value)}
                    className={errors.district ? 'error' : ''}
                  >
                    {availableDistricts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  {errors.district && <span className="error-message">{errors.district}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pincode">Pincode *</label>
                  <input
                    type="text"
                    id="pincode"
                    value={formData.address.pincode}
                    onChange={(e) => handleAddressChange('pincode', e.target.value)}
                    className={errors.pincode ? 'error' : ''}
                    placeholder="6-digit pincode"
                    maxLength={6}
                  />
                  {errors.pincode && <span className="error-message">{errors.pincode}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input
                    type="text"
                    id="country"
                    value={formData.address.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Phone Numbers</h4>
                {formData.shopPhoneNumbers.map((phone, index) => (
                  <div key={phone.id} className="phone-entry">
                    <div className="form-row">
                      <div className="form-group small">
                        <label>Country Code</label>
                        <input
                          type="text"
                          value={phone.countryCode}
                          onChange={(e) => updatePhoneNumber(phone.id, 'countryCode', e.target.value)}
                          readOnly
                        />
                      </div>

                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="text"
                          value={phone.number}
                          onChange={(e) => updatePhoneNumber(phone.id, 'number', e.target.value)}
                          placeholder="9876543210"
                          maxLength={10}
                        />
                      </div>

                      <div className="form-group">
                        <label>Type</label>
                        <select
                          value={phone.type}
                          onChange={(e) => updatePhoneNumber(phone.id, 'type', e.target.value)}
                        >
                          {PHONE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.shopPhoneNumbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhoneNumber(phone.id)}
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
            </form>
          )}

          <div className="form-actions">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="btn-secondary">
                Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button type="button" onClick={nextStep} className="btn-primary">
                Next
              </button>
            ) : (
              <button type="submit" form="shop-form-step3" className="btn-primary">
                {mode === 'add' ? 'Create Shop' : 'Update Shop'}
              </button>
            )}
            
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopForm; 