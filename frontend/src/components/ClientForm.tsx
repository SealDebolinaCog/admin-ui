import React, { useState, useEffect } from 'react';
import './ClientForm.css';
import ClientSearchDropdown from './ClientSearchDropdown';

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
  
  // Linked client information (for single linked client)
  linkedClientId?: string;
  linkedClientName?: string;
  linkedClientRelationship?: string;
}

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: ClientFormData) => void;
  initialData?: Partial<ClientFormData>;
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
      state: 'West Bengal',
      district: 'Kolkata',
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
      imageUrl: '',
      verificationStatus: 'pending'
    },
    aadhaarCard: {
      number: '',
      imageUrl: '',
      verificationStatus: 'pending'
    },
    otherDocuments: [],
    linkedClients: [],
    status: 'invite_now',
    accountBalance: 0,
    linkedClientId: '',
    linkedClientName: '',
    linkedClientRelationship: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [selectedClientForLinking, setSelectedClientForLinking] = useState<any>(null);
  const [relationshipType, setRelationshipType] = useState<'spouse' | 'parent' | 'child' | 'sibling' | 'business_partner' | 'guarantor' | 'other'>('other');
  const [relationshipDescription, setRelationshipDescription] = useState('');
  const [linkedClientsData, setLinkedClientsData] = useState<any[]>([]);

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      // Load linked clients data if available
      if (initialData.linkedClients && initialData.linkedClients.length > 0) {
        loadLinkedClientsData(initialData.linkedClients);
      }
      // If we have a linkedClientId but no linkedClients array (from editing), fetch the linked client data
      if (initialData.linkedClientId && (!initialData.linkedClients || initialData.linkedClients.length === 0)) {
        loadLinkedClientData(parseInt(initialData.linkedClientId));
      }
    }
  }, [initialData]);

  // Load linked clients data
  const loadLinkedClientsData = async (linkedClients: LinkedClient[]) => {
    try {
      const clientIds = linkedClients.map(lc => lc.clientId);
      const clientsData = [];
      
      for (const clientId of clientIds) {
        try {
          const response = await fetch(`/api/clients/${clientId}`);
          if (response.ok) {
            const clientData = await response.json();
            if (clientData.success) {
              clientsData.push(clientData.data);
            }
          }
        } catch (error) {
          console.error(`Error fetching client ${clientId}:`, error);
        }
      }
      
      setLinkedClientsData(clientsData);
    } catch (error) {
      console.error('Error loading linked clients data:', error);
    }
  };

  // Load single linked client data
  const loadLinkedClientData = async (clientId: number) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const clientData = await response.json();
        if (clientData.success) {
          setLinkedClientsData([clientData.data]);
        }
      }
    } catch (error) {
      console.error(`Error fetching linked client ${clientId}:`, error);
    }
  };

  // Get client name by ID
  const getClientNameById = (clientId: number) => {
    const client = linkedClientsData.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}`.trim() : `Client #${clientId}`;
  };

  // Get client name by ID from all clients (for editing)
  const getClientNameByIdFromAll = (clientId: number) => {
    // First try to find in linkedClientsData
    const client = linkedClientsData.find(c => c.id === clientId);
    if (client) {
      return `${client.firstName} ${client.lastName}`.trim();
    }
    
    // If not found, try to fetch from API
    if (initialData?.linkedClientId) {
      return initialData.linkedClientName || `Client #${clientId}`;
    }
    
    return `Client #${clientId}`;
  };

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
  const validateName = (name: string): { isValid: boolean; error?: string } => {
    if (!name.trim()) {
      return { isValid: false, error: 'Name is required' };
    }
    
    if (name.length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters long' };
    }
    
    if (name.length > 50) {
      return { isValid: false, error: 'Name must not exceed 50 characters' };
    }
    
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return { isValid: false, error: 'Name can only contain letters and spaces' };
    }
    
    return { isValid: true };
  };

  const validatePAN = (pan: string): { isValid: boolean; error?: string } => {
    // PAN is optional - if empty, it's valid
    if (!pan.trim()) {
      return { isValid: true };
    }
    
    // Check for symbols or invalid characters (only alphanumeric allowed)
    if (!/^[A-Za-z0-9]+$/.test(pan)) {
      return { isValid: false, error: 'PAN Number can only contain letters and numbers, no symbols or spaces' };
    }
    
    if (pan.length !== 10) {
      return { isValid: false, error: 'PAN Number must be exactly 10 characters' };
    }
    
    // Standard Indian PAN format: 5 letters, 4 digits, 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.toUpperCase())) {
      return { isValid: false, error: 'PAN format should be ABCDE1234F (5 letters, 4 digits, 1 letter)' };
    }
    
    return { isValid: true };
  };

  const validateAadhaar = (aadhaar: string): { isValid: boolean; error?: string } => {
    // Aadhaar is optional - if empty, it's valid
    if (!aadhaar.trim()) {
      return { isValid: true };
    }
    
    // Check for non-numeric characters (only digits allowed, no symbols or letters)
    if (!/^\d+$/.test(aadhaar.replace(/[\s-]/g, ''))) {
      return { isValid: false, error: 'Aadhaar Number can only contain digits, no symbols or characters' };
    }
    
    const cleanAadhaar = aadhaar.replace(/[\s-]/g, '');
    
    // Indian Aadhaar format: exactly 12 digits
    if (cleanAadhaar.length !== 12) {
      return { isValid: false, error: 'Aadhaar Number must be exactly 12 digits' };
    }
    
    const fullAadhaarRegex = /^\d{12}$/;
    if (!fullAadhaarRegex.test(cleanAadhaar)) {
      return { isValid: false, error: 'Aadhaar Number must contain only 12 digits' };
    }
    
    // Basic validation - cannot contain only repeated digits
    if (/^(0+|1+|2+|3+|4+|5+|6+|7+|8+|9+)$/.test(cleanAadhaar)) {
      return { isValid: false, error: 'Aadhaar Number cannot contain only repeated digits' };
    }
    
    return { isValid: true };
  };

  const validatePincode = (pincode: string): { isValid: boolean; error?: string } => {
    if (!pincode.trim()) {
      return { isValid: false, error: 'Pincode is required' };
    }
    
    if (pincode.length !== 6) {
      return { isValid: false, error: 'Pincode must be exactly 6 digits' };
    }
    
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(pincode)) {
      return { isValid: false, error: 'Pincode should start with 1-9 followed by 5 digits' };
    }
    
    return { isValid: true };
  };

  const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
    if (!phone.trim()) {
      return { isValid: false, error: 'Phone number is required' };
    }
    
    const cleanPhone = phone.replace(/[\s-+()]/g, '');
    
    if (cleanPhone.length !== 10) {
      return { isValid: false, error: 'Phone number must be exactly 10 digits' };
    }
    
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return { isValid: false, error: 'Phone number should start with 6-9 followed by 9 digits' };
    }
    
    return { isValid: true };
  };

  const validateEmail = (email: string): { isValid: boolean; error?: string } => {
    if (!email.trim()) {
      return { isValid: true }; // Email is optional
    }
    
    if (email.length > 254) {
      return { isValid: false, error: 'Email address is too long' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    // Check for common invalid patterns
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
      return { isValid: false, error: 'Email address format is invalid' };
    }
    
    return { isValid: true };
  };

  const validateKYC = (kyc: string): { isValid: boolean; error?: string } => {
    if (!kyc.trim()) {
      return { isValid: false, error: 'KYC/CIF Number is required' };
    }
    
    if (kyc.length < 8) {
      return { isValid: false, error: 'KYC/CIF Number must be at least 8 characters long' };
    }
    
    if (kyc.length > 20) {
      return { isValid: false, error: 'KYC/CIF Number must not exceed 20 characters' };
    }
    
    // Check for valid format: should start with letters followed by numbers
    // Common KYC formats: KYC202400001, CKYC12345678, etc.
    if (!/^[A-Za-z]{2,4}[0-9]{4,16}$/.test(kyc)) {
      return { isValid: false, error: 'KYC/CIF Number must start with 2-4 letters followed by 4-16 digits (e.g., KYC202400001)' };
    }
    
    // Check for sequential numbers (basic validation)
    const numberPart = kyc.replace(/^[A-Za-z]+/, '');
    if (/^(0+|1+|2+|3+|4+|5+|6+|7+|8+|9+)$/.test(numberPart)) {
      return { isValid: false, error: 'KYC/CIF Number cannot contain only repeated digits' };
    }
    
    return { isValid: true };
  };

  // Address validation
  const validateAddress = (address: string, fieldName: string, isRequired: boolean = true): { isValid: boolean; error?: string } => {
    // Check if field is empty or only spaces
    if (!address || !address.trim()) {
      return isRequired ? { isValid: false, error: `${fieldName} is required` } : { isValid: true };
    }
    
    // Check if field contains only spaces or has leading/trailing spaces (not allowed)
    if (/^\s+$/.test(address)) {
      return { isValid: false, error: `${fieldName} cannot contain only spaces` };
    }
    
    // Check for leading or trailing spaces
    if (address.trim() !== address) {
      return { isValid: false, error: `${fieldName} cannot have leading or trailing spaces` };
    }
    
    if (address.length < 3) {
      return { isValid: false, error: `${fieldName} must be at least 3 characters long` };
    }
    
    if (address.length > 100) {
      return { isValid: false, error: `${fieldName} must not exceed 100 characters` };
    }
    
    // Only allow alphanumeric characters, spaces, '/', '&', ',' and '.'
    if (!/^[a-zA-Z0-9\s/&,.]+$/.test(address)) {
      return { isValid: false, error: `${fieldName} can only contain letters, numbers, spaces, '/', '&', ',' and '.' symbols` };
    }
    
    return { isValid: true };
  };

  // Real-time validation handlers
  const createFieldValidator = (fieldName: string, validator: (value: string) => { isValid: boolean; error?: string }, formatter?: (value: string) => string) => {
    return (value: string) => {
      const formattedValue = formatter ? formatter(value) : value;
      
      // Update form data
      if (fieldName.includes('.')) {
        const [parent, child] = fieldName.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent as keyof ClientFormData] as any,
            [child]: formattedValue
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [fieldName]: formattedValue
        }));
      }
      
      // Clear existing error first
      if (errors[fieldName as keyof typeof errors]) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: ''
        }));
      }
      
      // Perform real-time validation
      if (formattedValue.trim() || fieldName === 'kycNumber' || fieldName === 'firstName' || fieldName === 'lastName' || fieldName === 'addressLine1' || fieldName === 'pincode') {
        const validation = validator(formattedValue);
        if (!validation.isValid) {
          setErrors(prev => ({
            ...prev,
            [fieldName]: validation.error || `Invalid ${fieldName}`
          }));
        }
      }
    };
  };

  // Create specific field handlers
  const handleKYCChange = createFieldValidator('kycNumber', validateKYC, (value) => value.toUpperCase());
  const handleFirstNameChange = createFieldValidator('firstName', (value) => validateName(value));
  const handleLastNameChange = createFieldValidator('lastName', (value) => validateName(value));
  const handleEmailChange = createFieldValidator('email', validateEmail);
  
  // Address field handlers (these need special handling for nested structure)
  const handleAddressLine1Change = (value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, addressLine1: value }
    }));
    
    // Clear existing error first
    if (errors.addressLine1) {
      setErrors(prev => ({ ...prev, addressLine1: '' }));
    }
    
    // Always validate Address Line 1 since it's mandatory
    const validation = validateAddress(value, 'Address Line 1', true);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, addressLine1: validation.error || 'Invalid address line 1' }));
    }
  };
  
  const handleAddressLine2Change = (value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, addressLine2: value }
    }));
    
    // Clear existing error first
    if (errors.addressLine2) {
      setErrors(prev => ({ ...prev, addressLine2: '' }));
    }
    
    // Validate Address Line 2 if user has entered anything (optional but validated when filled)
    // Always validate if there's any content, including spaces
    if (value.length > 0) {
      const validation = validateAddress(value, 'Address Line 2', false);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, addressLine2: validation.error || 'Invalid address line 2' }));
      }
    }
  };
  
  const handleAddressLine3Change = (value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, addressLine3: value }
    }));
    
    // Clear existing error first
    if (errors.addressLine3) {
      setErrors(prev => ({ ...prev, addressLine3: '' }));
    }
    
    // Validate Address Line 3 if user has entered anything (optional but validated when filled)
    // Always validate if there's any content, including spaces
    if (value.length > 0) {
      const validation = validateAddress(value, 'Address Line 3', false);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, addressLine3: validation.error || 'Invalid address line 3' }));
      }
    }
  };
  
  const handlePincodeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, pincode: value }
    }));
    
    if (errors.pincode) {
      setErrors(prev => ({ ...prev, pincode: '' }));
    }
    
    if (value.trim()) {
      const validation = validatePincode(value);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, pincode: validation.error || 'Invalid pincode' }));
      }
    }
  };

  // Form handlers
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Real-time validation for name fields
    if (field === 'firstName' || field === 'lastName' || field === 'middleName') {
      const newErrors: Record<string, string> = { ...errors };
      
      if (field === 'firstName') {
        if (!value.trim()) {
          newErrors.firstName = 'First Name cannot be empty.';
        } else if (!validateName(value)) {
          if (value.length > 50) {
            newErrors.firstName = 'First Name must not exceed 50 characters.';
          } else {
            newErrors.firstName = 'First Name must contain only letters.';
          }
        } else {
          delete newErrors.firstName;
        }
      } else if (field === 'lastName') {
        if (!value.trim()) {
          newErrors.lastName = 'Last Name cannot be empty.';
        } else if (!validateName(value)) {
          if (value.length > 50) {
            newErrors.lastName = 'Last Name must not exceed 50 characters.';
          } else {
            newErrors.lastName = 'Last Name must contain only letters.';
          }
        } else {
          delete newErrors.lastName;
        }
      } else if (field === 'middleName') {
        // Middle name is optional, but if provided, must follow same validation rules
        if (value && value.trim()) {
          // If user enters something, validate it with same rules as first/last name
          if (!validateName(value)) {
            if (value.length > 50) {
              newErrors.middleName = 'Middle Name must not exceed 50 characters.';
            } else {
              newErrors.middleName = 'Middle Name must contain only letters.';
            }
          } else {
            delete newErrors.middleName; // Valid input
          }
        } else {
          // Empty is allowed for middle name (optional field)
          delete newErrors.middleName;
        }
      }
      
      setErrors(newErrors);
    } else {
      // Clear error when user starts typing for non-name fields
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    }
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    // Use specific handlers for address fields with validation
    if (field === 'addressLine1') {
      handleAddressLine1Change(value);
      return;
    } else if (field === 'addressLine2') {
      handleAddressLine2Change(value);
      return;
    } else if (field === 'addressLine3') {
      handleAddressLine3Change(value);
      return;
    } else if (field === 'pincode') {
      handlePincodeChange(value);
      return;
    }
    
    // For other address fields (state, district, country)
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handlePhoneChange = (index: number, field: keyof PhoneNumber, value: any) => {
    const updatedPhones = [...formData.phoneNumbers];
    
    // If changing type to 'primary', set all other phones to 'secondary'
    if (field === 'type' && value === 'primary') {
      updatedPhones.forEach((phone, i) => {
        if (i !== index) {
          updatedPhones[i] = { ...phone, type: 'secondary' };
        }
      });
    }
    
    updatedPhones[index] = { ...updatedPhones[index], [field]: value };
    setFormData(prev => ({ ...prev, phoneNumbers: updatedPhones }));
    
    // Real-time validation for phone number field
    if (field === 'number') {
      const phoneValidation = validatePhone(value);
      const errorKey = `phone_${index}`;
      
      if (errors[errorKey as keyof typeof errors]) {
        setErrors(prev => ({
          ...prev,
          [errorKey]: ''
        }));
      }
      
      if (value.trim() && !phoneValidation.isValid) {
        setErrors(prev => ({
          ...prev,
          [errorKey]: phoneValidation.error || 'Invalid phone number'
        }));
      }
    }
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

    // Name validation
    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.error || 'Invalid first name';
    }
    
    const lastNameValidation = validateName(formData.lastName);
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.error || 'Invalid last name';
    }
    
    // KYC/CIF Number validation (required)
    const kycValidation = validateKYC(formData.kycNumber);
    if (!kycValidation.isValid) {
      newErrors.kycNumber = kycValidation.error || 'Invalid KYC/CIF Number';
    }
    
    // Address validation
    const addressLine1Validation = validateAddress(formData.address.addressLine1, 'Address Line 1', true);
    if (!addressLine1Validation.isValid) {
      newErrors.addressLine1 = addressLine1Validation.error || 'Invalid address line 1';
    }
    
    if (formData.address.addressLine2) {
      const addressLine2Validation = validateAddress(formData.address.addressLine2, 'Address Line 2', false);
      if (!addressLine2Validation.isValid) {
        newErrors.addressLine2 = addressLine2Validation.error || 'Invalid address line 2';
      }
    }
    
    if (formData.address.addressLine3) {
      const addressLine3Validation = validateAddress(formData.address.addressLine3, 'Address Line 3', false);
      if (!addressLine3Validation.isValid) {
        newErrors.addressLine3 = addressLine3Validation.error || 'Invalid address line 3';
      }
    }
    
    if (!formData.address.state) newErrors.state = 'State is required';
    if (!formData.address.district) newErrors.district = 'District is required';
    
    const pincodeValidation = validatePincode(formData.address.pincode);
    if (!pincodeValidation.isValid) {
      newErrors.pincode = pincodeValidation.error || 'Invalid pincode';
    }

    // Phone validation
    formData.phoneNumbers.forEach((phone, index) => {
      const phoneValidation = validatePhone(phone.number);
      if (!phoneValidation.isValid) {
        newErrors[`phone_${index}` as keyof typeof newErrors] = phoneValidation.error || 'Invalid phone number';
      }
    });

    // Email validation (optional)
    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error || 'Invalid email format';
      }
    }

    // PAN validation (optional - only validate if provided)
    const panValidation = validatePAN(formData.panCard?.number || '');
    if (!panValidation.isValid) {
      newErrors.panCard = panValidation.error || 'Invalid PAN format';
    }

    // Aadhaar validation (optional - only validate if provided)
    const aadhaarValidation = validateAadhaar(formData.aadhaarCard?.number || '');
    if (!aadhaarValidation.isValid) {
      newErrors.aadhaarCard = aadhaarValidation.error || 'Invalid Aadhaar format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      // First Name validation (required)
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First Name cannot be empty.';
      } else if (!validateName(formData.firstName)) {
        if (formData.firstName.length > 50) {
          newErrors.firstName = 'First Name must not exceed 50 characters.';
        } else {
          newErrors.firstName = 'First Name must contain only letters.';
        }
      }

      // Middle Name validation (optional but must be valid if provided)
      if (formData.middleName && formData.middleName.length > 0) {
        if (!validateName(formData.middleName.trim())) {
          if (formData.middleName.trim().length > 50) {
            newErrors.middleName = 'Middle Name must not exceed 50 characters.';
          } else {
            newErrors.middleName = 'Middle Name must contain only letters.';
          }
        }
      }

      // Last Name validation (required)
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last Name cannot be empty.';
      } else if (!validateName(formData.lastName)) {
        if (formData.lastName.length > 50) {
          newErrors.lastName = 'Last Name must not exceed 50 characters.';
        } else {
          newErrors.lastName = 'Last Name must contain only letters.';
        }
      }

      // KYC/CIF Number validation (required)
      const kycValidation = validateKYC(formData.kycNumber);
      if (!kycValidation.isValid) {
        newErrors.kycNumber = kycValidation.error || 'Invalid KYC/CIF Number';
      }
    } else if (currentStep === 2) {
      if (!formData.address.addressLine1.trim()) newErrors.addressLine1 = 'Address line 1 is required';
      if (!formData.address.state) newErrors.state = 'State is required';
      if (!formData.address.district) newErrors.district = 'District is required';
      if (!formData.address.pincode.trim()) {
        newErrors.pincode = 'Pincode is required';
      } else if (!validatePincode(formData.address.pincode)) {
        newErrors.pincode = 'Invalid pincode format';
      }
      
      // Phone number validation - validate only if phone numbers are provided
      formData.phoneNumbers.forEach((phone, index) => {
        if (phone.number.trim()) {
          const phoneValidation = validatePhone(phone.number);
          if (!phoneValidation.isValid) {
            newErrors[`phone_${index}`] = phoneValidation.error || 'Invalid phone number format';
          }
        }
      });
    } else if (currentStep === 3) {
      // Step 3 is KYC Documents - no required fields, all are optional
      // Clear any existing errors for step 3 to allow progression
      // PAN and Aadhaar validation is handled in real-time and form submission
      // Phone numbers are validated in step 2, not step 3
      
      // Ensure no validation errors block progression from step 3
      // Only validate PAN and Aadhaar if they have values, but don't block progression
      if (formData.panCard?.number && formData.panCard.number.trim()) {
        const panValidation = validatePAN(formData.panCard.number);
        if (!panValidation.isValid) {
          newErrors.panCard = panValidation.error || 'Invalid PAN format';
        }
      }
      
      if (formData.aadhaarCard?.number && formData.aadhaarCard.number.trim()) {
        const aadhaarValidation = validateAadhaar(formData.aadhaarCard.number);
        if (!aadhaarValidation.isValid) {
          newErrors.aadhaarCard = aadhaarValidation.error || 'Invalid Aadhaar format';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateCurrentStep()) {
      // Filter out empty phone numbers to prevent server errors
      const validPhoneNumbers = formData.phoneNumbers.filter(phone => 
        phone.number && phone.number.trim() !== ''
      );
      
      // Clean up PAN and Aadhaar data - send undefined if empty
      const cleanPanCard = formData.panCard?.number && formData.panCard.number.trim() 
        ? formData.panCard 
        : undefined;
      
      const cleanAadhaarCard = formData.aadhaarCard?.number && formData.aadhaarCard.number.trim() 
        ? formData.aadhaarCard 
        : undefined;
      
      // Clean up email - send undefined if empty
      const cleanEmail = formData.email && formData.email.trim() ? formData.email : undefined;
      
      // Send only valid phone numbers - let server handle empty array
      // Note: Server currently requires at least one phone number
      const phoneNumbers = validPhoneNumbers;
      
      // For new clients, automatically set status to "invite_now"
      const submitData = mode === 'add' 
        ? { 
            ...formData, 
            phoneNumbers,
            panCard: cleanPanCard,
            aadhaarCard: cleanAadhaarCard,
            email: cleanEmail,
            status: 'invite_now' as const 
          }
        : { 
            ...formData, 
            phoneNumbers,
            panCard: cleanPanCard,
            aadhaarCard: cleanAadhaarCard,
            email: cleanEmail
          };
      
      console.log('Submitting client data:', submitData);
      console.log('Phone numbers after filtering:', validPhoneNumbers);
      
      onSubmit(submitData);
    } else {
      console.log('Form validation failed on final step');
      console.log('Current errors:', errors);
    }
  };

  const nextStep = (e?: React.MouseEvent) => {
    // Explicitly prevent any form submission behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent any form submission when navigating between steps
    if (currentStep < 4) {
      // For step 3 (KYC Documents), skip validation and just navigate
      // since all fields are optional
      if (currentStep === 3) {
        console.log('Tab 3: Direct navigation to Tab 4');
        setCurrentStep(4);
        return;
      } else {
        // For other steps, validate before proceeding
        if (validateCurrentStep()) {
          setCurrentStep(currentStep + 1);
        }
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const addLinkedClient = (selectedClient: any) => {
    setSelectedClientForLinking(selectedClient);
    setRelationshipType('other'); // Reset relationship type
    setRelationshipDescription(''); // Reset description
    setShowRelationshipModal(true);
  };

  const removeLinkedClient = (index: number) => {
    const linkedClientToRemove = formData.linkedClients[index];
    setFormData(prev => ({
      ...prev,
      linkedClients: prev.linkedClients.filter((_, i) => i !== index)
    }));
    
    // Remove the client from the linked clients data
    setLinkedClientsData(prev => prev.filter(client => client.id !== linkedClientToRemove.clientId));
  };

  const handleRelationshipTypeChange = (type: 'spouse' | 'parent' | 'child' | 'sibling' | 'business_partner' | 'guarantor' | 'other') => {
    setRelationshipType(type);
  };

  const handleRelationshipDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRelationshipDescription(e.target.value);
  };

  const confirmLinkedClient = () => {
    if (selectedClientForLinking) {
      const newLinkedClient: LinkedClient = {
        clientId: selectedClientForLinking.id,
        relationshipType: relationshipType,
        relationshipDescription: relationshipDescription || undefined,
        linkedAt: new Date().toISOString()
      };
      setFormData(prev => ({
        ...prev,
        linkedClients: [...prev.linkedClients, newLinkedClient]
      }));
      
      // Add the new client to the linked clients data
      setLinkedClientsData(prev => [...prev, selectedClientForLinking]);
      
      setShowRelationshipModal(false);
      setSelectedClientForLinking(null);
      setRelationshipType('other');
      setRelationshipDescription('');
    }
  };

  const cancelLinkedClient = () => {
    setShowRelationshipModal(false);
    setSelectedClientForLinking(null);
    setRelationshipType('other');
    setRelationshipDescription('');
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
                    onChange={(e) => handleFirstNameChange(e.target.value)}
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
                    className={errors.middleName ? 'error' : ''}
                  />
                  {errors.middleName && <span className="error-text">{errors.middleName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleLastNameChange(e.target.value)}
                    className={errors.lastName ? 'error' : ''}
                  />
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="kycNumber">KYC/CIF Number *</label>
                  <input
                    type="text"
                    id="kycNumber"
                    value={formData.kycNumber}
                    onChange={(e) => handleKYCChange(e.target.value)}
                    className={errors.kycNumber ? 'error' : ''}
                    placeholder="KYC202400001"
                    maxLength={20}
                    style={{
                      textTransform: 'uppercase'
                    }}
                  />
                  {errors.kycNumber && <span className="error-text">{errors.kycNumber}</span>}
                </div>

                {/* Status field only visible when editing existing clients */}
                {mode === 'edit' && (
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
                )}
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
                      onChange={(e) => handleAddressLine2Change(e.target.value)}
                      className={errors.addressLine2 ? 'error' : ''}
                      placeholder="Near Temple"
                    />
                    {errors.addressLine2 && <span className="error-text">{errors.addressLine2}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="addressLine3">Address Line 3</label>
                    <input
                      type="text"
                      id="addressLine3"
                      value={formData.address.addressLine3 || ''}
                      onChange={(e) => handleAddressLine3Change(e.target.value)}
                      className={errors.addressLine3 ? 'error' : ''}
                      placeholder="Sector 5"
                    />
                    {errors.addressLine3 && <span className="error-text">{errors.addressLine3}</span>}
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
                <h4>Contact Information</h4>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email || ''}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={errors.email ? 'error' : ''}
                    placeholder="client@example.com"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
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
                        <label>Phone Number</label>
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
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setFormData(prev => ({
                          ...prev,
                          panCard: { ...prev.panCard!, number: value }
                        }));
                        
                        // Real-time PAN validation
                        if (errors.panCard) {
                          setErrors(prev => ({ ...prev, panCard: '' }));
                        }
                        
                        if (value.trim()) {
                          const panValidation = validatePAN(value);
                          if (!panValidation.isValid) {
                            setErrors(prev => ({ ...prev, panCard: panValidation.error || 'Invalid PAN' }));
                          }
                        }
                      }}
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
                      accept="image/*,.pdf,application/pdf"
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
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          aadhaarCard: { ...prev.aadhaarCard!, number: value }
                        }));
                        
                        // Real-time Aadhaar validation
                        if (errors.aadhaarCard) {
                          setErrors(prev => ({ ...prev, aadhaarCard: '' }));
                        }
                        
                        if (value.trim()) {
                          const aadhaarValidation = validateAadhaar(value);
                          if (!aadhaarValidation.isValid) {
                            setErrors(prev => ({ ...prev, aadhaarCard: aadhaarValidation.error || 'Invalid Aadhaar' }));
                          }
                        }
                      }}
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
                      accept="image/*,.pdf,application/pdf"
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
                
                {/* Display existing linked clients */}
                {formData.linkedClients && formData.linkedClients.length > 0 && (
                  <div className="linked-clients-list">
                    {formData.linkedClients.map((linkedClient, index) => (
                      <div key={index} className="linked-client-item">
                        <div className="linked-client-info">
                          <div className="linked-client-name">
                            {getClientNameByIdFromAll(linkedClient.clientId)}
                          </div>
                          <div className="linked-client-relationship">
                            <span className="relationship-type">{linkedClient.relationshipType.replace('_', ' ')}</span>
                            {linkedClient.relationshipDescription && (
                              <span className="relationship-description">: {linkedClient.relationshipDescription}</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="remove-linked-client-btn"
                          onClick={() => removeLinkedClient(index)}
                          title="Remove linked client"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new linked client */}
                <div className="add-linked-client-section">
                  <ClientSearchDropdown
                    value=""
                    onChange={() => {}} // This will be handled by onClientSelect
                    placeholder="Search and select clients to link"
                    onClientSelect={(selectedClient) => {
                      addLinkedClient(selectedClient);
                    }}
                  />
                  <div className="help-text">
                    Start typing to search for existing clients in the database
                  </div>
                </div>
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
              <button type="button" onClick={(e) => nextStep(e)} className="btn-primary">
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

        {/* Relationship Modal */}
        {showRelationshipModal && selectedClientForLinking && (
          <div className="relationship-modal-overlay">
            <div className="relationship-modal-content">
              <h3>Link Client</h3>
              <p>Linking {selectedClientForLinking.firstName} {selectedClientForLinking.lastName} to this client.</p>
              
              <div className="form-group">
                <label>Relationship Type:</label>
                <select
                  value={relationshipType}
                  onChange={(e) => handleRelationshipTypeChange(e.target.value as 'spouse' | 'parent' | 'child' | 'sibling' | 'business_partner' | 'guarantor' | 'other')}
                >
                  {RELATIONSHIP_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Relationship Description (Optional):</label>
                <textarea
                  value={relationshipDescription}
                  onChange={handleRelationshipDescriptionChange}
                  rows={3}
                  placeholder="e.g., Spouse, Parent, Business Partner"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={confirmLinkedClient} className="btn-primary">
                  Confirm Link
                </button>
                <button type="button" onClick={cancelLinkedClient} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientForm;
