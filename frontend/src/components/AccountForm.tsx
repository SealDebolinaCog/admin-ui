import React, { useState, useEffect } from 'react';
import './ShopForm.css';
import ClientSearchDropdown from './ClientSearchDropdown';

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
  accountOwnershipType: 'single' | 'joint';
  accountHolderNames: string[]; // Array to store single or multiple names
  institutionType: 'bank' | 'post_office';
  accountType: 'savings' | 'current' | 'fixed' | 'recurring' | 'business' | 'recurring_deposit' | '1td' | '2td' | '3td' | '4td' | '5td' | 'national_savings_certificate' | 'kishan_vikash_patra' | 'monthly_income_scheme';
  institutionName: string;
  branchCode: string;
  ifscCode?: string;
  tenure: number;
  
  // Account holder information
  address: Address;
  
  // Nominee information
  nomineeName: string;
  nomineeRelation: string;
  
  // Status
  status: 'active' | 'suspended' | 'fined' | 'matured' | 'closed';
  
  // Payment details
  startDate: string;
  maturityDate: string;
  paymentType: 'monthly' | 'annually' | 'one_time';
  amount: number;
  lastPaymentDate: string;
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
  // Bank Account Types
  { value: 'savings', label: 'Savings Account', institutionType: 'bank' },
  { value: 'current', label: 'Current Account', institutionType: 'bank' },
  { value: 'fixed', label: 'Fixed Deposit', institutionType: 'bank' },
  { value: 'recurring', label: 'Recurring Deposit', institutionType: 'bank' },
  { value: 'business', label: 'Business Account', institutionType: 'bank' },
  // Post Office Account Types
  { value: 'recurring_deposit', label: 'Recurring Deposit', institutionType: 'post_office' },
  { value: '1td', label: '1 Year Term Deposit (1TD)', institutionType: 'post_office' },
  { value: '2td', label: '2 Year Term Deposit (2TD)', institutionType: 'post_office' },
  { value: '3td', label: '3 Year Term Deposit (3TD)', institutionType: 'post_office' },
  { value: '4td', label: '4 Year Term Deposit (4TD)', institutionType: 'post_office' },
  { value: '5td', label: '5 Year Term Deposit (5TD)', institutionType: 'post_office' },
  { value: 'national_savings_certificate', label: 'National Savings Certificate', institutionType: 'post_office' },
  { value: 'kishan_vikash_patra', label: 'Kishan Vikash Patra', institutionType: 'post_office' },
  { value: 'monthly_income_scheme', label: 'Monthly Income Scheme', institutionType: 'post_office' }
];

// Function to get account types based on institution type
const getAccountTypesForInstitution = (institutionType: string) => {
  return ACCOUNT_TYPES.filter(type => type.institutionType === institutionType);
};



// Account ownership types
const ACCOUNT_OWNERSHIP_TYPES = [
  { value: 'single', label: 'Single' },
  { value: 'joint', label: 'Joint' }
];

// Account statuses
const ACCOUNT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'fined', label: 'Fined' },
  { value: 'matured', label: 'Matured' },
  { value: 'closed', label: 'Closed' }
];

const AccountForm: React.FC<AccountFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    accountNumber: '',
    accountOwnershipType: 'joint',
    accountHolderNames: ['', ''],
    institutionType: 'post_office',
    accountType: 'recurring_deposit',
    institutionName: 'Aranghata Post Office',
    branchCode: '102024',
    ifscCode: '',
    tenure: 12,
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
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    paymentType: 'monthly',
    amount: 0,
    lastPaymentDate: ''
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

  // Reset account type when institution type changes
  useEffect(() => {
    const availableTypes = getAccountTypesForInstitution(formData.institutionType);
    if (!availableTypes.find(type => type.value === formData.accountType)) {
      setFormData(prev => ({
        ...prev,
        accountType: (availableTypes[0]?.value as any) || 'savings'
      }));
    }
  }, [formData.institutionType]);

  // Reset account holder names when ownership type changes
  useEffect(() => {
    if (formData.accountOwnershipType === 'single') {
      setFormData(prev => ({
        ...prev,
        accountHolderNames: prev.accountHolderNames.length > 0 ? [prev.accountHolderNames[0]] : ['']
      }));
    } else {
      // Joint account - ensure at least 2 holders
      if (formData.accountHolderNames.length < 2) {
        setFormData(prev => ({
          ...prev,
          accountHolderNames: prev.accountHolderNames.length > 0 ? [...prev.accountHolderNames, ''] : ['']
        }));
      }
    }
  }, [formData.accountOwnershipType]);

  // Auto-set branch code when post office is selected
  useEffect(() => {
    if (formData.institutionType === 'post_office') {
      if (formData.institutionName === 'Aranghata Post Office') {
        setFormData(prev => ({
          ...prev,
          branchCode: '102024'
        }));
      } else if (formData.institutionName === 'Central Post Office') {
        setFormData(prev => ({
          ...prev,
          branchCode: '999999'
        }));
      }
    }
  }, [formData.institutionName, formData.institutionType]);

  // Auto-set tenure based on account type
  useEffect(() => {
    let newTenure = 12; // Default tenure
    
    if (formData.institutionType === 'post_office') {
      switch (formData.accountType) {
        case '1td':
          newTenure = 12;
          break;
        case '2td':
          newTenure = 24;
          break;
        case '3td':
          newTenure = 36;
          break;
        case '4td':
          newTenure = 48;
          break;
        case '5td':
          newTenure = 60;
          break;
        case 'recurring_deposit':
          newTenure = 60; // 5 years for RD
          break;
        case 'national_savings_certificate':
          newTenure = 60; // 5 years for NSC
          break;
        case 'kishan_vikash_patra':
          newTenure = 120; // 10 years for KVP
          break;
        case 'monthly_income_scheme':
          newTenure = 60; // 5 years for MIS
          break;
        default:
          newTenure = 12;
      }
    } else {
      // Bank accounts
      switch (formData.accountType) {
        case 'fixed':
          newTenure = 60; // 5 years for fixed deposits
          break;
        case 'recurring':
          newTenure = 60; // 5 years for recurring deposits
          break;
        default:
          newTenure = 0; // No tenure for savings/current accounts
      }
    }
    
    setFormData(prev => ({
      ...prev,
      tenure: newTenure
    }));
  }, [formData.accountType, formData.institutionType]);

  // Auto-calculate maturity date based on start date and tenure
  useEffect(() => {
    if (formData.startDate && formData.tenure > 0) {
      const startDate = new Date(formData.startDate);
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + formData.tenure);
      
      setFormData(prev => ({
        ...prev,
        maturityDate: maturityDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.startDate, formData.tenure]);

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

  const validateTenure = (tenure: number): { isValid: boolean; error?: string } => {
    if (tenure < 1) {
      return { isValid: false, error: 'Tenure must be at least 1 month' };
    }
    if (tenure > 120) {
      return { isValid: false, error: 'Tenure cannot exceed 120 months (10 years)' };
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

      // Validate account holder names
      if (formData.accountOwnershipType === 'single') {
        if (!formData.accountHolderNames[0] || !formData.accountHolderNames[0].trim()) {
          newErrors.accountHolderNames = 'Account holder name is required';
        } else {
          const holderNameValidation = validateName(formData.accountHolderNames[0]);
          if (!holderNameValidation.isValid) {
            newErrors.accountHolderNames = holderNameValidation.error || 'Invalid account holder name';
          }
        }
      } else {
        // Joint account validation
        const validNames = formData.accountHolderNames.filter(name => name && name.trim());
        if (validNames.length === 0) {
          newErrors.accountHolderNames = 'At least one account holder name is required';
        } else {
          // Validate each name
          for (let i = 0; i < formData.accountHolderNames.length; i++) {
            const name = formData.accountHolderNames[i];
            if (name && name.trim()) {
              const holderNameValidation = validateName(name);
              if (!holderNameValidation.isValid) {
                newErrors.accountHolderNames = `Invalid name for holder ${i + 1}: ${holderNameValidation.error}`;
                break;
              }
            }
          }
        }
      }

      if (!formData.institutionName || !formData.institutionName.trim()) {
        newErrors.institutionName = 'Institution name is required';
      }

      if (!formData.branchCode || !formData.branchCode.trim()) {
        newErrors.branchCode = 'Branch code is required';
      }

      if (formData.institutionType === 'bank') {
        const ifscValidation = validateIFSC(formData.ifscCode || '');
        if (!ifscValidation.isValid) {
          newErrors.ifscCode = ifscValidation.error || 'Invalid IFSC code';
        }
      }

      const tenureValidation = validateTenure(formData.tenure);
      if (!tenureValidation.isValid) {
        newErrors.tenure = tenureValidation.error || 'Invalid tenure';
      }
    }

    // Step 2 validation (Account Holder Information)
    if (currentStep === 2) {
      // No validation needed for this step
    }

    // Step 3 validation (Payment Details)
    if (currentStep === 3) {
      // Payment details validation
      if (!formData.startDate) {
        newErrors.startDate = 'Start date is required';
      }
      if (!formData.paymentType) {
        newErrors.paymentType = 'Payment type is required';
      }
      if (formData.amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
      if (formData.paymentType === 'monthly' && !formData.lastPaymentDate) {
        newErrors.lastPaymentDate = 'Last payment date is required for monthly payments';
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

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    const fullName = `${client.firstName} ${client.lastName}`.trim();
    
    // Update the first account holder name
    setFormData(prev => ({
      ...prev,
      accountHolderNames: [fullName, ...prev.accountHolderNames.slice(1)]
    }));
    
    // Clear any existing errors
    if (errors.accountHolderNames) {
      setErrors(prev => ({ ...prev, accountHolderNames: '' }));
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

  const handleHolderNamesChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      accountHolderNames: prev.accountHolderNames.map((name, i) => 
        i === index ? value : name
      )
    }));
    
    // Clear error when user starts typing
    if (errors.accountHolderNames) {
      setErrors(prev => ({ ...prev, accountHolderNames: '' }));
    }
    
    // Real-time validation
    if (value.trim()) {
      const holderNameValidation = validateName(value);
      if (!holderNameValidation.isValid) {
        setErrors(prev => ({ ...prev, accountHolderNames: holderNameValidation.error || 'Invalid account holder name' }));
      }
    }
  };

  const addHolder = () => {
    setFormData(prev => ({
      ...prev,
      accountHolderNames: [...prev.accountHolderNames, '']
    }));
  };

  const removeHolder = (index: number) => {
    if (formData.accountHolderNames.length > 1) {
      setFormData(prev => ({
        ...prev,
        accountHolderNames: prev.accountHolderNames.filter((_, i) => i !== index)
      }));
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



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Show confirmation dialog
      const confirmMessage = `Are you sure you want to ${mode === 'add' ? 'create' : 'update'} this account?\n\nAccount: ${formData.accountNumber}\nHolder: ${formData.accountHolderNames[0]}\nInstitution: ${formData.institutionName}`;
      
      if (window.confirm(confirmMessage)) {
        onSubmit(formData);
      }
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
          <div className="header-actions">
            {mode === 'add' && (
              <button 
                type="button" 
                className="quick-fill-btn"
                onClick={() => {
                  setFormData({
                    ...formData,
                    accountNumber: '1234567890',
                    accountHolderNames: ['John Doe'],
                    institutionName: 'Sample Bank',
                    branchCode: 'BR001',
                    ifscCode: 'SAMP0001234',
                    tenure: 24,
                    startDate: '2024-01-01',
                    maturityDate: '2026-01-01',
                    paymentType: 'monthly',
                    amount: 5000,
                    lastPaymentDate: '2024-01-15',
                    address: {
                      addressLine1: '123 Main Street',
                      addressLine2: 'Apt 4B',
                      addressLine3: '',
                      state: 'Maharashtra',
                      district: 'Mumbai',
                      pincode: '400001',
                      country: 'India'
                    },
                    nomineeName: 'Jane Doe',
                    nomineeRelation: 'Spouse'
                  });
                }}
                title="Fill with sample data for testing"
              >
                🧪 Quick Fill
              </button>
            )}
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="shop-form-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Basic Info</span>
            {currentStep === 1 && <span className="step-indicator">●</span>}
          </div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Account Setup</span>
            {currentStep === 2 && <span className="step-indicator">●</span>}
          </div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Payment Details</span>
            {currentStep === 3 && <span className="step-indicator">●</span>}
          </div>
        </div>

        <div className="shop-form">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Basic Account Information</h3>
              
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
                <label htmlFor="accountOwnershipType">Account Ownership Type *</label>
                <select
                  id="accountOwnershipType"
                  value={formData.accountOwnershipType}
                  onChange={(e) => handleInputChange('accountOwnershipType', e.target.value)}
                >
                  {ACCOUNT_OWNERSHIP_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <div className="help-text">
                  {formData.accountOwnershipType === 'single' 
                    ? 'Single account holder - one person owns the account' 
                    : 'Joint account - multiple people can access the account'}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="accountHolderNames">
                  {formData.accountOwnershipType === 'single' ? 'Customer Name (Select from Database)' : 'Account Holder Names'} *
                </label>
                <div className="account-holders-section">
                  {formData.accountOwnershipType === 'single' ? (
                    <div>
                      <ClientSearchDropdown
                        value={formData.accountHolderNames[0] || ''}
                        onChange={(value) => handleHolderNamesChange(0, value)}
                        placeholder="Search for a client..."
                        className={errors.accountHolderNames ? 'error' : ''}
                        onClientSelect={handleClientSelect}
                      />
                      <div className="help-text">
                        Start typing to search for existing clients in the database
                      </div>
                    </div>
                  ) : (
                    <div className="joint-holders">
                      {formData.accountHolderNames.map((name, index) => (
                        <div key={index} className="joint-holder-input">
                          {index === 0 ? (
                            // First holder uses the searchable dropdown
                            <ClientSearchDropdown
                              value={name}
                              onChange={(value) => handleHolderNamesChange(index, value)}
                              placeholder={`Search for client ${index + 1}...`}
                              className={errors.accountHolderNames ? 'error' : ''}
                              onClientSelect={(client) => {
                                const fullName = `${client.firstName} ${client.lastName}`.trim();
                                handleHolderNamesChange(index, fullName);
                              }}
                            />
                          ) : (
                            // Additional holders can use regular input or dropdown
                            <div className="holder-input-group">
                              <ClientSearchDropdown
                                value={name}
                                onChange={(value) => handleHolderNamesChange(index, value)}
                                placeholder={`Search for client ${index + 1}...`}
                                className={errors.accountHolderNames ? 'error' : ''}
                                onClientSelect={(client) => {
                                  const fullName = `${client.firstName} ${client.lastName}`.trim();
                                  handleHolderNamesChange(index, fullName);
                                }}
                              />
                              <button
                                type="button"
                                className="remove-holder-btn"
                                onClick={() => removeHolder(index)}
                                title="Remove holder"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          <div className="help-text">
                            Start typing to search for existing clients in the database
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="add-holder-btn"
                        onClick={addHolder}
                        title="Add another holder"
                      >
                        ➕ Add Holder
                      </button>
                    </div>
                  )}
                </div>
                {errors.accountHolderNames && <span className="error-message">{errors.accountHolderNames}</span>}
              </div>












            </div>
          )}

          {/* Step 2: Account Setup */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Account Setup & Holder Information</h3>
              


              {/* 1. Institution Type */}
              <div className="form-group">
                <label htmlFor="institutionType">Institution Type *</label>
                <select
                  id="institutionType"
                  value={formData.institutionType}
                  onChange={(e) => handleInputChange('institutionType', e.target.value)}
                  className={errors.institutionType ? 'error' : ''}
                >
                  <option value="">Select Institution Type</option>
                  <option value="bank">🏦 Bank</option>
                  <option value="post_office">📮 Post Office</option>
                </select>
                {errors.institutionType && <span className="error-message">{errors.institutionType}</span>}
                <div className="help-text">Post office accounts include savings certificates, recurring deposits, etc.</div>
              </div>

              {/* 2. Post Office Name */}
              <div className="form-group">
                <label htmlFor="institutionName">
                  {formData.institutionType === 'post_office' ? '📮 Post Office Name' : '🏦 Bank Name'} *
                </label>
                {formData.institutionType === 'post_office' ? (
                  <select
                    id="institutionName"
                    value={formData.institutionName}
                    onChange={(e) => handleInputChange('institutionName', e.target.value)}
                    className={errors.institutionName ? 'error' : ''}
                  >
                    <option value="">Select Post Office</option>
                    <option value="Aranghata Post Office">Aranghata Post Office</option>
                    <option value="Central Post Office">Central Post Office</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    id="institutionName"
                    value={formData.institutionName}
                    onChange={(e) => handleInputChange('institutionName', e.target.value)}
                    className={errors.institutionName ? 'error' : ''}
                    placeholder="Enter bank name"
                  />
                )}
                {errors.institutionName && <span className="error-message">{errors.institutionName}</span>}
              </div>

              {/* 3. Branch Code */}
              <div className="form-group">
                <label htmlFor="branchCode">Branch Code *</label>
                {formData.institutionType === 'post_office' ? (
                  <input
                    type="text"
                    id="branchCode"
                    value={formData.branchCode}
                    readOnly
                    className="readonly-field"
                    style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                  />
                ) : (
                  <input
                    type="text"
                    id="branchCode"
                    value={formData.branchCode}
                    onChange={(e) => handleInputChange('branchCode', e.target.value)}
                    className={errors.branchCode ? 'error' : ''}
                    placeholder="Enter branch code"
                  />
                )}
                {formData.institutionType === 'post_office' && (
                  <div className="help-text">
                    Branch code is automatically set based on post office selection
                  </div>
                )}
                {errors.branchCode && <span className="error-message">{errors.branchCode}</span>}
              </div>

              {/* 4. Account Type */}
              <div className="form-group">
                <label htmlFor="accountType">Account Type</label>
                <select
                  id="accountType"
                  value={formData.accountType}
                  onChange={(e) => handleInputChange('accountType', e.target.value)}
                  className={errors.accountType ? 'error' : ''}
                >
                  <option value="">Select Account Type</option>
                  {getAccountTypesForInstitution(formData.institutionType).map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.accountType && <span className="error-message">{errors.accountType}</span>}
                <div className="help-text">Select the type of account you want to open</div>
              </div>

              {/* 5. Tenure */}
              <div className="form-group">
                <label htmlFor="tenure">Tenure (Months)</label>
                <input
                  type="number"
                  id="tenure"
                  value={formData.tenure}
                  readOnly
                  className="readonly-field"
                  style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                />
                <div className="help-text">Tenure is automatically set based on account type</div>
              </div>

              {/* 6. Account Status */}
              <div className="form-group">
                <label htmlFor="status">Account Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={errors.status ? 'error' : ''}
                >
                  <option value="">Select Status</option>
                  {ACCOUNT_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {errors.status && <span className="error-message">{errors.status}</span>}
                <div className="help-text">Select the initial status for the account</div>
              </div>

              {/* IFSC Code for Banks */}
              {formData.institutionType === 'bank' && (
                <div className="form-group">
                  <label htmlFor="ifscCode">IFSC Code *</label>
                  <input
                    type="text"
                    id="ifscCode"
                    value={formData.ifscCode || ''}
                    onChange={(e) => handleIFSCChange(e.target.value)}
                    className={errors.ifscCode ? 'error' : ''}
                    placeholder="SBIN0001234"
                    maxLength={11}
                  />
                  {errors.ifscCode && <span className="error-message">{errors.ifscCode}</span>}
                </div>
              )}

            </div>
          )}

          {/* Step 3: Address & Nominee */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit} className="form-step" id="account-form-step3">
              <h3>Account Payment Details</h3>
              










              <div className="form-section">
                <h4>Account Payment Details</h4>
                
                {/* 1. Start Date */}
                <div className="form-group">
                  <label htmlFor="startDate">Start Date *</label>
                  <input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={errors.startDate ? 'error' : ''}
                    required
                  />
                  {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                  <div className="help-text">Select the account start date (DD/MM/YYYY format)</div>
                </div>

                {/* 2. Account Maturity */}
                <div className="form-group">
                  <label htmlFor="maturityDate">Account Maturity</label>
                  <input
                    type="date"
                    id="maturityDate"
                    value={formData.maturityDate}
                    readOnly
                    className="readonly-field"
                    style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                  />
                  <div className="help-text">Maturity date is automatically calculated based on tenure</div>
                </div>

                {/* 3. Payment Type */}
                <div className="form-group">
                  <label htmlFor="paymentType">Payment Type *</label>
                  <select
                    id="paymentType"
                    value={formData.paymentType}
                    onChange={(e) => handleInputChange('paymentType', e.target.value)}
                    className={errors.paymentType ? 'error' : ''}
                    required
                  >
                    <option value="">Select Payment Type</option>
                    <option value="monthly">Monthly</option>
                    <option value="annually">Annually</option>
                    <option value="one_time">One Time</option>
                  </select>
                  {errors.paymentType && <span className="error-message">{errors.paymentType}</span>}
                  <div className="help-text">Select how often payments will be made</div>
                </div>

                {/* 4. Amount */}
                <div className="form-group">
                  <label htmlFor="amount">Amount *</label>
                  <input
                    type="number"
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    className={errors.amount ? 'error' : ''}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                  {errors.amount && <span className="error-message">{errors.amount}</span>}
                  <div className="help-text">Enter the payment amount</div>
                </div>

                {/* 5. Last Payment Made (only for Monthly) */}
                {formData.paymentType === 'monthly' && (
                  <div className="form-group">
                    <label htmlFor="lastPaymentDate">Last Payment Made</label>
                    <input
                      type="date"
                      id="lastPaymentDate"
                      value={formData.lastPaymentDate}
                      onChange={(e) => handleInputChange('lastPaymentDate', e.target.value)}
                      className={errors.lastPaymentDate ? 'error' : ''}
                    />
                    {errors.lastPaymentDate && <span className="error-message">{errors.lastPaymentDate}</span>}
                    <div className="help-text">Date of the last monthly payment made</div>
                  </div>
                )}
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