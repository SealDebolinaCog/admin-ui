import React, { useState, useEffect } from 'react';
import './ShopForm.css';

// Account interfaces
interface Address {
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  state: string;
  district: string;
  pincode: string;
  country: string;
}

interface AccountFormData {
  // Account details
  accountNumber: string;
  accountHolderName: string;
  accountType: 'savings' | 'current' | 'fixed' | 'recurring' | 'business';
  bankName: string;
  branchCode: string;
  ifscCode: string;
  balance: number;
  
  // Account holder information
  email: string;
  phone: string;
  address: Address;
  
  // Nominee information
  nomineeName: string;
  nomineeRelation: string;
  
  // Status
  status: 'active' | 'suspended' | 'closed';
}

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accountData: AccountFormData) => void;
  initialData?: Partial<AccountFormData>;
  mode: 'add' | 'edit';
}

// Account types
const ACCOUNT_TYPES = [
  { value: 'savings', label: 'Savings Account' },
  { value: 'current', label: 'Current Account' },
  { value: 'fixed', label: 'Fixed Deposit' },
  { value: 'recurring', label: 'Recurring Deposit' },
  { value: 'business', label: 'Business Account' }
];

// Account statuses
const ACCOUNT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'closed', label: 'Closed' }
];

// Indian states and union territories data
const INDIAN_STATES = [
  { state: 'Andhra Pradesh', districts: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Anantapur'] },
  { state: 'Arunachal Pradesh', districts: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur', 'Bomdila', 'Ziro', 'Along', 'Tezu'] },
  { state: 'Assam', districts: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon'] },
  { state: 'Bihar', districts: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah'] },
  { state: 'Chhattisgarh', districts: ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh'] },
  { state: 'Goa', districts: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim'] },
  { state: 'Gujarat', districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand'] },
  { state: 'Haryana', districts: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal'] },
  { state: 'Himachal Pradesh', districts: ['Shimla', 'Mandi', 'Solan', 'Kangra', 'Kullu', 'Hamirpur', 'Una', 'Chamba'] },
  { state: 'Jharkhand', districts: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih', 'Palamu'] },
  { state: 'Karnataka', districts: ['Bangalore', 'Mysore', 'Hubli-Dharwad', 'Mangalore', 'Belgaum', 'Gulbarga', 'Bellary', 'Bijapur'] },
  { state: 'Kerala', districts: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Kannur'] },
  { state: 'Madhya Pradesh', districts: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna'] },
  { state: 'Maharashtra', districts: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur'] },
  { state: 'Manipur', districts: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Chandel', 'Senapati', 'Tamenglong', 'Ukhrul'] },
  { state: 'Meghalaya', districts: ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Williamnagar', 'Baghmara', 'Resubelpara', 'Mairang'] },
  { state: 'Mizoram', districts: ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Mamit', 'Lawngtlai'] },
  { state: 'Nagaland', districts: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Mon', 'Phek', 'Zunheboto'] },
  { state: 'Odisha', districts: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak'] },
  { state: 'Punjab', districts: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Hoshiarpur', 'Mohali', 'Moga'] },
  { state: 'Rajasthan', districts: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar'] },
  { state: 'Sikkim', districts: ['Gangtok', 'Namchi', 'Mangan', 'Gyalshing', 'Soreng', 'Ravongla', 'Jorethang', 'Singtam'] },
  { state: 'Tamil Nadu', districts: ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Vellore', 'Tiruchirappalli', 'Erode', 'Thoothukkudi'] },
  { state: 'Telangana', districts: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda'] },
  { state: 'Tripura', districts: ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar', 'Belonia', 'Khowai', 'Teliamura', 'Ambassa'] },
  { state: 'Uttar Pradesh', districts: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly'] },
  { state: 'Uttarakhand', districts: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Kotdwar'] },
  { state: 'West Bengal', districts: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Nadia'] },
  { state: 'Delhi', districts: ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Shahdara', 'Dwarka'] },
  { state: 'Jammu and Kashmir', districts: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Pulwama', 'Kupwara', 'Budgam', 'Shopian'] },
  { state: 'Ladakh', districts: ['Leh', 'Kargil'] },
  { state: 'Chandigarh', districts: ['Chandigarh'] },
  { state: 'Dadra and Nagar Haveli and Daman and Diu', districts: ['Silvassa', 'Daman', 'Diu'] },
  { state: 'Lakshadweep', districts: ['Kavaratti', 'Agatti', 'Amini', 'Andrott', 'Kadmat', 'Kalpeni', 'Minicoy'] },
  { state: 'Puducherry', districts: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'] },
  { state: 'Andaman and Nicobar Islands', districts: ['Port Blair', 'Car Nicobar', 'Great Nicobar', 'Havelock', 'Neil Island'] }
];

const AccountForm: React.FC<AccountFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AccountFormData>({
    accountNumber: '',
    accountHolderName: '',
    accountType: 'savings',
    bankName: '',
    branchCode: '',
    ifscCode: '',
    balance: 0,
    email: '',
    phone: '',
    address: {
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      state: 'West Bengal',
      district: 'Nadia',
      pincode: '741501',
      country: 'India'
    },
    nomineeName: '',
    nomineeRelation: '',
    status: 'active'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when component mounts or initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validatePincode = (pincode: string): boolean => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  };

  const validateAccountNumber = (accountNumber: string): { isValid: boolean; error?: string } => {
    if (!accountNumber || !accountNumber.trim()) {
      return { isValid: false, error: 'Account number is required' };
    }
    if (accountNumber.trim().length < 8) {
      return { isValid: false, error: 'Account number must be at least 8 characters long' };
    }
    if (accountNumber.trim().length > 20) {
      return { isValid: false, error: 'Account number must not exceed 20 characters' };
    }
    if (!/^[0-9]+$/.test(accountNumber.trim())) {
      return { isValid: false, error: 'Account number can only contain numbers' };
    }
    return { isValid: true };
  };

  const validateIFSC = (ifsc: string): { isValid: boolean; error?: string } => {
    if (!ifsc || !ifsc.trim()) {
      return { isValid: false, error: 'IFSC code is required' };
    }
    if (ifsc.trim().length !== 11) {
      return { isValid: false, error: 'IFSC code must be exactly 11 characters' };
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim())) {
      return { isValid: false, error: 'Invalid IFSC code format' };
    }
    return { isValid: true };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Step 1 validation (Account Details)
    if (currentStep === 1) {
      const accountNumberValidation = validateAccountNumber(formData.accountNumber);
      if (!accountNumberValidation.isValid) {
        newErrors.accountNumber = accountNumberValidation.error || 'Invalid account number';
      }

      if (!formData.accountHolderName || !formData.accountHolderName.trim()) {
        newErrors.accountHolderName = 'Account holder name is required';
      } else {
        const holderNameValidation = validateName(formData.accountHolderName);
        if (!holderNameValidation.isValid) {
          newErrors.accountHolderName = holderNameValidation.error || 'Invalid account holder name';
        }
      }

      if (!formData.bankName || !formData.bankName.trim()) {
        newErrors.bankName = 'Bank name is required';
      }

      if (!formData.branchCode || !formData.branchCode.trim()) {
        newErrors.branchCode = 'Branch code is required';
      }

      const ifscValidation = validateIFSC(formData.ifscCode);
      if (!ifscValidation.isValid) {
        newErrors.ifscCode = ifscValidation.error || 'Invalid IFSC code';
      }

      if (formData.balance < 0) {
        newErrors.balance = 'Balance cannot be negative';
      }
    }

    // Step 2 validation (Account Holder Information)
    if (currentStep === 2) {
      if (formData.email && !validateEmail(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (formData.phone && !validatePhone(formData.phone)) {
        newErrors.phone = 'Invalid phone number';
      }
    }

    // Step 3 validation (Address & Nominee)
    if (currentStep === 3) {
      if (!formData.address.addressLine1.trim()) {
        newErrors.addressLine1 = 'Address line 1 is required';
      }
      if (!formData.address.state.trim()) {
        newErrors.state = 'State is required';
      }
      if (!formData.address.district.trim()) {
        newErrors.district = 'District is required';
      }
      if (!formData.address.pincode.trim()) {
        newErrors.pincode = 'Pincode is required';
      }
      if (!validatePincode(formData.address.pincode)) {
        newErrors.pincode = 'Invalid pincode format';
      }
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

  const handleAccountNumberChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      accountNumber: value
    }));
    
    // Clear error when user starts typing
    if (errors.accountNumber) {
      setErrors(prev => ({ ...prev, accountNumber: '' }));
    }
    
    // Real-time validation
    if (value.trim()) {
      const accountNumberValidation = validateAccountNumber(value);
      if (!accountNumberValidation.isValid) {
        setErrors(prev => ({ ...prev, accountNumber: accountNumberValidation.error || 'Invalid account number' }));
      }
    }
  };

  const handleHolderNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      accountHolderName: value
    }));
    
    // Clear error when user starts typing
    if (errors.accountHolderName) {
      setErrors(prev => ({ ...prev, accountHolderName: '' }));
    }
    
    // Real-time validation
    if (value.trim()) {
      const holderNameValidation = validateName(value);
      if (!holderNameValidation.isValid) {
        setErrors(prev => ({ ...prev, accountHolderName: holderNameValidation.error || 'Invalid account holder name' }));
      }
    }
  };

  const handleIFSCChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      ifscCode: value.toUpperCase()
    }));
    
    // Clear error when user starts typing
    if (errors.ifscCode) {
      setErrors(prev => ({ ...prev, ifscCode: '' }));
    }
    
    // Real-time validation
    if (value.trim()) {
      const ifscValidation = validateIFSC(value);
      if (!ifscValidation.isValid) {
        setErrors(prev => ({ ...prev, ifscCode: ifscValidation.error || 'Invalid IFSC code' }));
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
          <h2>{mode === 'add' ? 'Add New Account' : 'Edit Account'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="shop-form-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Account Details</span>
          </div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Holder Info</span>
          </div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Address & Nominee</span>
          </div>
        </div>

        <div className="shop-form">
          {/* Step 1: Account Details */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Account Information</h3>
              
              <div className="form-group">
                <label htmlFor="accountNumber">Account Number *</label>
                <input
                  type="text"
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  className={errors.accountNumber ? 'error' : ''}
                  placeholder="Enter account number"
                  maxLength={20}
                />
                {errors.accountNumber && <span className="error-message">{errors.accountNumber}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="accountHolderName">Account Holder Name *</label>
                <input
                  type="text"
                  id="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={(e) => handleHolderNameChange(e.target.value)}
                  className={errors.accountHolderName ? 'error' : ''}
                  placeholder="Enter account holder name"
                  maxLength={50}
                />
                {errors.accountHolderName && <span className="error-message">{errors.accountHolderName}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="accountType">Account Type</label>
                  <select
                    id="accountType"
                    value={formData.accountType}
                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                  >
                    {ACCOUNT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="balance">Opening Balance</label>
                  <input
                    type="number"
                    id="balance"
                    value={formData.balance}
                    onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bankName">Bank Name *</label>
                <input
                  type="text"
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className={errors.bankName ? 'error' : ''}
                  placeholder="Enter bank name"
                />
                {errors.bankName && <span className="error-message">{errors.bankName}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="branchCode">Branch Code *</label>
                  <input
                    type="text"
                    id="branchCode"
                    value={formData.branchCode}
                    onChange={(e) => handleInputChange('branchCode', e.target.value)}
                    className={errors.branchCode ? 'error' : ''}
                    placeholder="Enter branch code"
                  />
                  {errors.branchCode && <span className="error-message">{errors.branchCode}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="ifscCode">IFSC Code *</label>
                  <input
                    type="text"
                    id="ifscCode"
                    value={formData.ifscCode}
                    onChange={(e) => handleIFSCChange(e.target.value)}
                    className={errors.ifscCode ? 'error' : ''}
                    placeholder="SBIN0001234"
                    maxLength={11}
                  />
                  {errors.ifscCode && <span className="error-message">{errors.ifscCode}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Account Holder Information */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Account Holder Information</h3>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'error' : ''}
                  placeholder="Enter email address"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'error' : ''}
                  placeholder="9876543210"
                  maxLength={10}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
                <div className="help-text">Enter 10-digit mobile number</div>
              </div>

              <div className="form-group">
                <label htmlFor="status">Account Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  {ACCOUNT_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Address & Nominee */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit} className="form-step" id="account-form-step3">
              <h3>Address & Nominee Information</h3>
              
              <div className="form-group">
                <label htmlFor="addressLine1">Address Line 1 *</label>
                <input
                  type="text"
                  id="addressLine1"
                  value={formData.address.addressLine1}
                  onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                  className={errors.addressLine1 ? 'error' : ''}
                  placeholder="Enter address line 1"
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
                  placeholder="Enter address line 2 (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="addressLine3">Address Line 3</label>
                <input
                  type="text"
                  id="addressLine3"
                  value={formData.address.addressLine3}
                  onChange={(e) => handleAddressChange('addressLine3', e.target.value)}
                  placeholder="Enter address line 3 (optional)"
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
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(stateData => (
                      <option key={stateData.state} value={stateData.state}>
                        {stateData.state}
                      </option>
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
                    <option value="">Select District</option>
                    {INDIAN_STATES.find(s => s.state === formData.address.state)?.districts.map(district => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    )) || []}
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
                    placeholder="Enter pincode"
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
                    readOnly
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Nominee Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nomineeName">Nominee Name</label>
                    <input
                      type="text"
                      id="nomineeName"
                      value={formData.nomineeName}
                      onChange={(e) => handleInputChange('nomineeName', e.target.value)}
                      placeholder="Enter nominee name"
                      maxLength={50}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="nomineeRelation">Relation</label>
                    <select
                      id="nomineeRelation"
                      value={formData.nomineeRelation}
                      onChange={(e) => handleInputChange('nomineeRelation', e.target.value)}
                    >
                      <option value="">Select Relation</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
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
              <button type="submit" form="account-form-step3" className="btn-primary">
                {mode === 'add' ? 'Create Account' : 'Update Account'}
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

export default AccountForm; 