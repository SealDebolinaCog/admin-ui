import React, { useState, useEffect } from 'react';
import './ShopForm.css';
import ClientSearchDropdown from './ClientSearchDropdown';
import axios from 'axios'; // Added axios import

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
  id?: number;
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
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' }
];

const ShopForm: React.FC<ShopFormProps> = ({ isOpen, onClose, onSubmit, initialData, mode }) => {
  console.log('ShopForm rendered with mode:', mode);
  console.log('ShopForm isOpen:', isOpen);
  console.log('ShopForm initialData:', initialData);
  
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
      district: 'Kolkata',
      pincode: '',
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
    status: 'pending'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [shopClients, setShopClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      console.log('ShopForm: Initializing with data:', initialData);
      setFormData({
        id: initialData.id,
        shopName: initialData.shopName || '',
        shopType: initialData.shopType || 'retail',
        category: initialData.category || 'electronics',
        description: initialData.description || '',
        ownerName: initialData.ownerName || '',
        ownerEmail: initialData.ownerEmail || '',
        ownerPhone: initialData.ownerPhone || '',
        address: {
          addressLine1: initialData.address?.addressLine1 || '',
          addressLine2: initialData.address?.addressLine2 || '',
          addressLine3: initialData.address?.addressLine3 || '',
          state: initialData.address?.state || 'West Bengal',
          district: initialData.address?.district || 'Kolkata',
          pincode: initialData.address?.pincode || '',
          country: initialData.address?.country || 'India'
        },
        gstNumber: initialData.gstNumber || { number: '', verificationStatus: 'pending' },
        panNumber: initialData.panNumber || { number: '', verificationStatus: 'pending' },
        businessLicenseNumber: initialData.businessLicenseNumber || '',
        registrationDate: initialData.registrationDate || new Date().toISOString().split('T')[0],
        shopPhoneNumbers: initialData.shopPhoneNumbers || [{
          id: 'phone-1',
          countryCode: '+91',
          number: '',
          type: 'primary',
          isVerified: false
        }],
        shopEmail: initialData.shopEmail || '',
        website: initialData.website || '',
        annualRevenue: initialData.annualRevenue || 0,
        employeeCount: initialData.employeeCount || 1,
        documents: initialData.documents || [],
        status: initialData.status || 'pending'
      });

      // Fetch existing clients if editing
      if (mode === 'edit' && initialData.id) {
        console.log('ShopForm: Fetching clients for shop ID:', initialData.id);
        fetchShopClients(initialData.id);
      }
    }
  }, [initialData, mode]);

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

    // Step 4 validation (Manage Clients) - No validation required, informational step
    if (currentStep === 4) {
      // This step is informational only, no validation required
      // Users can proceed to submit the form
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
    console.log('handleAddressChange called:', field, value);
    console.log('Current formData.address:', formData.address);
    
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Client management functions
  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
  };

  const fetchShopClients = async (shopId: number) => {
    try {
      console.log('ShopForm: Fetching clients for shop ID:', shopId);
      setLoading(true);
      const response = await axios.get(`/api/shop-clients/shop/${shopId}`);
      console.log('ShopForm: API response:', response.data);
      
      if (response.data.success) {
        const clients = response.data.data.map((client: any) => ({
          id: client.id,
          clientId: client.clientId,
          firstName: client.clientFirstName,
          lastName: client.clientLastName,
          email: client.clientEmail,
          phone: client.clientPhone
        }));
        console.log('ShopForm: Mapped clients:', clients);
        setShopClients(clients);
      } else {
        console.error('ShopForm: API returned error:', response.data.error);
      }
    } catch (error) {
      console.error('ShopForm: Error fetching shop clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const addClientToShop = async () => {
    if (!selectedClient) return;
    
    console.log('ShopForm: Adding client to shop:', selectedClient);
    setLoading(true);
    try {
      // For edit mode, add client immediately to database
      if (mode === 'edit' && initialData?.id) {
        console.log('ShopForm: Edit mode - adding client to database for shop ID:', initialData.id);
        const response = await axios.post('/api/shop-clients', {
          shopId: initialData.id,
          clientId: selectedClient.id,
        });
        
        console.log('ShopForm: API response for adding client:', response.data);
        
        if (response.data.success) {
          console.log('ShopForm: Client added successfully, refreshing list');
          // Refresh the client list
          await fetchShopClients(initialData.id);
          setSelectedClient(null);
        } else {
          console.error('ShopForm: Failed to add client:', response.data.error);
        }
      } else {
        console.log('ShopForm: Add mode - adding client to local state');
        // For add mode, just add to local state
        const newClient = {
          id: Date.now(), // Temporary ID
          clientId: selectedClient.id,
          firstName: selectedClient.firstName,
          lastName: selectedClient.lastName,
          email: selectedClient.email,
          phone: selectedClient.phone
        };
        
        console.log('ShopForm: Adding client to local state:', newClient);
        setShopClients(prev => [...prev, newClient]);
        setSelectedClient(null);
      }
    } catch (error) {
      console.error('ShopForm: Error adding client:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeClientFromShop = async (clientId: number) => {
    console.log('ShopForm: Removing client with ID:', clientId);
    try {
      // For edit mode, remove from database immediately
      if (mode === 'edit' && initialData?.id) {
        console.log('ShopForm: Edit mode - removing client from database for shop ID:', initialData.id);
        await axios.delete(`/api/shop-clients/shop/${initialData.id}/client/${clientId}`);
        console.log('ShopForm: Client removed from database, refreshing list');
        // Refresh the client list
        await fetchShopClients(initialData.id);
      } else {
        console.log('ShopForm: Add mode - removing client from local state');
        // For add mode, just remove from local state
        setShopClients(prev => prev.filter(client => client.clientId !== clientId));
      }
    } catch (error) {
      console.error('ShopForm: Error removing client:', error);
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log('Form submitted!');
    console.log('Current formData:', formData);
    console.log('Current formData.address:', formData.address);
    console.log('Current shopClients:', shopClients);
    
    if (validateForm()) {
      console.log('Validation passed, calling onSubmit');
      
      // For add mode, we need to handle client associations after shop creation
      if (mode === 'add') {
        // Create a data object that includes both shop data and client associations
        const submissionData = {
          ...formData,
          clientAssociations: [...shopClients]
        };
        
        // Call onSubmit with the enhanced data
        onSubmit(submissionData);
      } else {
        // For edit mode, client associations are already saved in the database
        // Just pass the shop data
        onSubmit(formData);
      }
    } else {
      console.log('Validation failed, errors:', errors);
    }
  };

  const nextStep = () => {
    if (validateForm()) {
      console.log('Validation passed, moving to next step');
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
        console.log('Moved to step:', currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Quick fill function to populate form with test data
  const handleQuickFill = () => {
    // Generate a random test data set
    const testDataSets = [
      {
        shopName: 'Tech Solutions Hub',
        shopType: 'service' as const,
        category: 'Technology',
        description: 'Comprehensive IT solutions and digital transformation services',
        ownerName: 'Rajesh Kumar',
        ownerEmail: 'rajesh@techsolutions.com',
        ownerPhone: '9876543210',
        address: {
          addressLine1: '123 Tech Park',
          addressLine2: 'Block A, Floor 3',
          addressLine3: 'Innovation Zone',
          state: 'West Bengal',
          district: 'Kolkata',
          pincode: '700001',
          country: 'India'
        },
        gstNumber: {
          number: '19ABCDE1234F1Z5',
          verificationStatus: 'pending' as const
        },
        panNumber: {
          number: 'ABCDE1234F',
          verificationStatus: 'pending' as const
        },
        businessLicenseNumber: 'BL202400001',
        registrationDate: '2024-01-15',
        shopPhoneNumbers: [
          {
            id: '1',
            countryCode: '+91',
            number: '9876543210',
            type: 'primary' as const,
            isVerified: false
          },
          {
            id: '2',
            countryCode: '+91',
            number: '8765432109',
            type: 'secondary' as const,
            isVerified: false
          }
        ],
        shopEmail: 'info@techsolutions.com',
        website: 'www.techsolutions.com',
        annualRevenue: 2500000,
        employeeCount: 25
      },
      {
        shopName: 'Green Grocers Market',
        shopType: 'retail' as const,
        category: 'Food & Beverages',
        description: 'Fresh fruits, vegetables, and organic grocery store',
        ownerName: 'Priya Sharma',
        ownerEmail: 'priya@greengrocers.com',
        ownerPhone: '8765432109',
        address: {
          addressLine1: '456 Market Street',
          addressLine2: 'Shop 15',
          addressLine3: 'Food Court Area',
          state: 'West Bengal',
          district: 'Kolkata',
          pincode: '700010',
          country: 'India'
        },
        gstNumber: {
          number: '19FGHIJ5678K2Z6',
          verificationStatus: 'pending' as const
        },
        panNumber: {
          number: 'FGHIJ5678K',
          verificationStatus: 'pending' as const
        },
        businessLicenseNumber: 'BL202400002',
        registrationDate: '2024-02-20',
        shopPhoneNumbers: [
          {
            id: '1',
            countryCode: '+91',
            number: '8765432109',
            type: 'primary' as const,
            isVerified: false
          }
        ],
        shopEmail: 'contact@greengrocers.com',
        website: 'www.greengrocers.com',
        annualRevenue: 800000,
        employeeCount: 8
      },
      {
        shopName: 'Fashion Forward Boutique',
        shopType: 'retail' as const,
        category: 'Fashion & Apparel',
        description: 'Trendy fashion boutique with latest designer collections',
        ownerName: 'Amit Patel',
        ownerEmail: 'amit@fashionforward.com',
        ownerPhone: '7654321098',
        address: {
          addressLine1: '789 Fashion Mall',
          addressLine2: 'Unit 25',
          addressLine3: 'Luxury Wing',
          state: 'West Bengal',
          district: 'Kolkata',
          pincode: '700011',
          country: 'India'
        },
        gstNumber: {
          number: '19LMNOP9012Q3Z7',
          verificationStatus: 'pending' as const
        },
        panNumber: {
          number: 'LMNOP9012Q',
          verificationStatus: 'pending' as const
        },
        businessLicenseNumber: 'BL202400003',
        registrationDate: '2024-03-10',
        shopPhoneNumbers: [
          {
            id: '1',
            countryCode: '+91',
            number: '7654321098',
            type: 'primary' as const,
            isVerified: false
          }
        ],
        shopEmail: 'style@fashionforward.com',
        website: 'www.fashionforward.com',
        annualRevenue: 1500000,
        employeeCount: 12
      }
    ];

    // Test client data for linking to shops
    const testClients = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        phone: '9876543210',
        kycNumber: 'KYC202400001',
        status: 'active' as const,
        address: {
          addressLine1: '123 Client Street',
          addressLine2: 'Apartment 5A',
          addressLine3: 'Residential Block',
          state: 'West Bengal',
          district: 'Kolkata',
          pincode: '700001',
          country: 'India'
        }
      },
      {
        id: 2,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@test.com',
        phone: '8765432109',
        kycNumber: 'KYC202400002',
        status: 'active' as const,
        address: {
          addressLine1: '456 Client Avenue',
          addressLine2: 'House 12',
          addressLine3: 'Garden Colony',
          state: 'West Bengal',
          district: 'Kolkata',
          pincode: '700010',
          country: 'India'
        }
      },
      {
        id: 3,
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@test.com',
        phone: '7654321098',
        kycNumber: 'KYC202400003',
        status: 'active' as const,
        address: {
          addressLine1: '789 Client Road',
          addressLine2: 'Flat 8B',
          addressLine3: 'Business District',
          state: 'West Bengal',
          district: 'Kolkata',
          pincode: '700011',
          country: 'India'
        }
      }
    ];

    // Randomly select one of the test data sets
    const randomIndex = Math.floor(Math.random() * testDataSets.length);
    const selectedTestData = testDataSets[randomIndex];

    // Randomly select 1-2 test clients to link
    const numClientsToLink = Math.floor(Math.random() * 2) + 1;
    const shuffledClients = [...testClients].sort(() => 0.5 - Math.random());
    const selectedClients = shuffledClients.slice(0, numClientsToLink);

    const testData: ShopFormData = {
      ...selectedTestData,
      documents: [],
      status: 'pending'
    };

    setFormData(testData);
    
    // Set the linked clients data for the client management section
    setShopClients(selectedClients);
    
    // Clear any existing errors
    setErrors({});
    
    // Show success message with a brief flash effect
    const button = document.querySelector('.quick-fill-btn') as HTMLButtonElement;
    if (button) {
      button.style.background = '#10b981';
      button.style.transform = 'scale(1.05)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 200);
    }
    
    // Show success message
    console.log(`Form populated with test data for ${testData.shopName} and ${selectedClients.length} linked clients`);
  };

  if (!isOpen) return null;

  return (
    <div className="shop-form-overlay">
      <div className="shop-form-modal">
        <div className="shop-form-header">
          <h2>{mode === 'add' ? 'Add New Shop' : 'Edit Shop'}</h2>
          <div className="header-actions">
            {mode === 'add' && (
              <button 
                type="button" 
                className="quick-fill-btn" 
                onClick={handleQuickFill}
                title="Quick fill with test shop and client data"
              >
                ⚡ Quick Fill
              </button>
            )}
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="shop-form-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Shop Details</span>
            {currentStep === 1 && <span className="step-indicator">●</span>}
          </div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Owner Info</span>
            {currentStep === 2 && <span className="step-indicator">●</span>}
          </div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Address & Contact</span>
            {currentStep === 3 && <span className="step-indicator">●</span>}
          </div>
          <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
            <span className="step-number">4</span>
            <span className="step-label">Manage Clients</span>
            {currentStep === 4 && <span className="step-indicator">●</span>}
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
            <div className="form-step" id="shop-form-step3">
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
            </div>
          )}

          {/* Step 4: Manage Clients */}
          {currentStep === 4 && (
            <div className="form-step">
              <h3>Manage Clients</h3>
              
              <div className="form-section">
                <h4>Add New Client</h4>
                <div className="add-client-form">
                  <div className="form-group">
                    <label>Select Client</label>
                    <ClientSearchDropdown
                      value={selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : ''}
                      onChange={() => {}}
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

              <div className="form-section">
                <h4>Current Clients ({shopClients.length})</h4>
                {shopClients.length === 0 ? (
                  <div className="no-clients-message">
                    <p>No clients are currently associated with this shop. Use the form above to add your first client.</p>
                  </div>
                ) : (
                  <div className="clients-list">
                    {shopClients.map(client => (
                      <div key={client.id} className="client-item">
                        <div className="client-info">
                          <div className="client-name">
                            {client.firstName} {client.lastName}
                          </div>
                          <div className="client-details">
                            {client.email && <span className="client-email">{client.email}</span>}
                            {client.phone && <span className="client-phone">{client.phone}</span>}
                          </div>
                        </div>
                        <button
                          className="btn-remove"
                          onClick={() => removeClientFromShop(client.clientId)}
                          title="Remove client from shop"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
              <button type="button" onClick={handleSubmit} className="btn-primary">
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