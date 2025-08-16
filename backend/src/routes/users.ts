import { Router, Request, Response } from 'express';

const router = Router();

// Validation helper functions
const validatePAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

const validateAadhaar = (aadhaar: string): boolean => {
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

// Generate unique client ID
const generateClientId = (): string => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `CLI-${year}-${randomNum.toString().padStart(6, '0')}`;
};

// Generate unique KYC number
const generateKYCNumber = (): string => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 900000) + 100000;
  return `KYC${year}${randomNum.toString().padStart(6, '0')}`;
};

// Validate client data
const validateClientData = (clientData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!clientData.firstName?.trim()) errors.push('First name is required');
  if (!clientData.lastName?.trim()) errors.push('Last name is required');
  if (clientData.email && !validateEmail(clientData.email)) errors.push('Invalid email format');
  if (!clientData.address?.addressLine1?.trim()) errors.push('Address line 1 is required');
  if (!clientData.address?.state?.trim()) errors.push('State is required');
  if (!clientData.address?.district?.trim()) errors.push('District is required');
  if (!clientData.address?.pincode || !validatePincode(clientData.address.pincode)) errors.push('Valid pincode is required');

  if (!clientData.phoneNumbers || !Array.isArray(clientData.phoneNumbers) || clientData.phoneNumbers.length === 0) {
    errors.push('At least one phone number is required');
  } else {
    clientData.phoneNumbers.forEach((phone: any, index: number) => {
      if (!phone.number || !validatePhone(phone.number)) {
        errors.push(`Invalid phone number at position ${index + 1}`);
      }
    });
  }

  if (clientData.panCard?.number && !validatePAN(clientData.panCard.number)) {
    errors.push('Invalid PAN format (ABCDE1234F)');
  }
  if (clientData.aadhaarCard?.number && !validateAadhaar(clientData.aadhaarCard.number)) {
    errors.push('Invalid Aadhaar format');
  }

  const validStatuses = ['invite_now', 'pending', 'active', 'suspended', 'deleted'];
  if (clientData.status && !validStatuses.includes(clientData.status)) {
    errors.push('Invalid status value');
  }

  return { isValid: errors.length === 0, errors };
};

// Interfaces
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

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  company?: string;
  status?: 'active' | 'inactive' | 'pending';
  joinDate?: string;
  lastLogin?: string;
  accountBalance?: number;
  profilePicture?: string;
}

// Generate mock data (simplified for space)
const generateMockUsers = (): User[] => {
  const users: User[] = [];
  const firstNames = ['Aarav', 'Priya', 'Rajesh', 'Sunita', 'Vivaan', 'Ananya', 'Aditya', 'Fatima'];
  const lastNames = ['Sharma', 'Patel', 'Singh', 'Reddy', 'Gupta', 'Kumar', 'Yadav', 'Nair'];
  const companies = ['Mumbai Branch', 'Delhi Branch', 'Bangalore Branch', 'Chennai Branch'];
  const statuses: ('active' | 'inactive' | 'pending')[] = ['active', 'inactive', 'pending'];

  for (let i = 1; i <= 500; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    users.push({
      id: i,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`,
      role: 'client',
      phone: `${Math.floor(Math.random() * 4) + 6}${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
      company: companies[Math.floor(Math.random() * companies.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      joinDate: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      lastLogin: Math.random() > 0.3 ? `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` : undefined,
      accountBalance: Math.floor(Math.random() * 500000) + 10000,
      profilePicture: undefined
    });
  }
  
  return users;
};

const mockUsers: User[] = generateMockUsers();

// Routes
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }
    
    const startIndex = (page - 1) * limit;
    let filteredUsers = mockUsers;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.company?.toLowerCase().includes(searchLower)
      );
    }
    
    const totalRecords = filteredUsers.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const users = filteredUsers.slice(startIndex, startIndex + limit);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        recordsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        startRecord: totalRecords > 0 ? startIndex + 1 : 0,
        endRecord: Math.min(startIndex + limit, totalRecords)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const clientData = req.body;
    const validation = validateClientData(clientData);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    const newUser: User = {
      id: mockUsers.length + 1,
      firstName: clientData.firstName.trim(),
      lastName: clientData.lastName.trim(),
      email: clientData.email?.trim() || '',
      role: 'client',
      phone: clientData.phoneNumbers?.[0]?.number,
      company: `${clientData.address?.district || 'Unknown'} Branch`,
      status: clientData.status === 'active' ? 'active' : 'pending',
      joinDate: new Date().toISOString().split('T')[0],
      accountBalance: clientData.accountBalance || 0
    };
    
    mockUsers.push(newUser);
    res.status(201).json({ success: true, data: newUser, message: 'Client created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create client' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const clientData = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const validation = validateClientData(clientData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    const existingUser = mockUsers[userIndex];
    const updatedUser: User = {
      ...existingUser,
      firstName: clientData.firstName?.trim() || existingUser.firstName,
      lastName: clientData.lastName?.trim() || existingUser.lastName,
      email: clientData.email?.trim() || existingUser.email,
      phone: clientData.phoneNumbers?.[0]?.number || existingUser.phone,
      status: clientData.status === 'active' ? 'active' : clientData.status === 'pending' ? 'pending' : 'inactive',
      accountBalance: clientData.accountBalance || existingUser.accountBalance
    };
    
    mockUsers[userIndex] = updatedUser;
    res.json({ success: true, data: updatedUser, message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update client' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    mockUsers.splice(userIndex, 1);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

export default router;
