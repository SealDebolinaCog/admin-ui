"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Validation helper functions
const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
};
const validateAadhaar = (aadhaar) => {
    const aadhaarRegex = /^(\d{4}\s?\d{4}\s?\d{4}|XXXX-XXXX-\d{4})$/;
    return aadhaarRegex.test(aadhaar.replace(/\s/g, ''));
};
const validatePincode = (pincode) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
};
const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
};
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
// Generate unique client ID
const generateClientId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `CLI-${year}-${randomNum.toString().padStart(6, '0')}`;
};
// Generate unique KYC number
const generateKYCNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 900000) + 100000;
    return `KYC${year}${randomNum.toString().padStart(6, '0')}`;
};
// Validate client data
const validateClientData = (clientData) => {
    const errors = [];
    if (!clientData.firstName?.trim())
        errors.push('First name is required');
    if (!clientData.lastName?.trim())
        errors.push('Last name is required');
    if (clientData.email && !validateEmail(clientData.email))
        errors.push('Invalid email format');
    if (!clientData.address?.addressLine1?.trim())
        errors.push('Address line 1 is required');
    if (!clientData.address?.state?.trim())
        errors.push('State is required');
    if (!clientData.address?.district?.trim())
        errors.push('District is required');
    if (!clientData.address?.pincode || !validatePincode(clientData.address.pincode))
        errors.push('Valid pincode is required');
    // Phone numbers are optional, but if provided, they must be valid
    if (clientData.phoneNumbers && Array.isArray(clientData.phoneNumbers) && clientData.phoneNumbers.length > 0) {
        clientData.phoneNumbers.forEach((phone, index) => {
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
// Generate mock data (simplified for space)
const generateMockUsers = () => {
    const users = [];
    const firstNames = ['Aarav', 'Priya', 'Rajesh', 'Sunita', 'Vivaan', 'Ananya', 'Aditya', 'Fatima'];
    const lastNames = ['Sharma', 'Patel', 'Singh', 'Reddy', 'Gupta', 'Kumar', 'Yadav', 'Nair'];
    const companies = ['Mumbai Branch', 'Delhi Branch', 'Bangalore Branch', 'Chennai Branch'];
    const statuses = ['invite_now', 'pending', 'active', 'suspended'];
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
const mockUsers = generateMockUsers();
// Routes
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters'
            });
        }
        const startIndex = (page - 1) * limit;
        let filteredUsers = mockUsers;
        // Extract filter and advanced search parameters
        const statusFilter = req.query.status;
        const dateCreatedFrom = req.query.dateCreatedFrom;
        const dateCreatedTo = req.query.dateCreatedTo;
        const dateModifiedFrom = req.query.dateModifiedFrom;
        const dateModifiedTo = req.query.dateModifiedTo;
        const aadhaarNumber = req.query.aadhaarNumber;
        const addressLine1 = req.query.addressLine1;
        const panNumber = req.query.panNumber;
        const emailId = req.query.emailId;
        const mobileNumber = req.query.mobileNumber;
        // Apply name search filter (minimum 3 characters required)
        if (search && search.length >= 3) {
            const searchLower = search.toLowerCase();
            filteredUsers = filteredUsers.filter(user => `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower) ||
                user.company?.toLowerCase().includes(searchLower));
        }
        // Apply status filter
        if (statusFilter) {
            const statusArray = statusFilter.split(',');
            filteredUsers = filteredUsers.filter(user => statusArray.includes(user.status));
        }
        // Apply date created filter
        if (dateCreatedFrom || dateCreatedTo) {
            filteredUsers = filteredUsers.filter(user => {
                const userDate = new Date(user.createdAt || '2024-01-01');
                const fromDate = dateCreatedFrom ? new Date(dateCreatedFrom) : new Date('1900-01-01');
                const toDate = dateCreatedTo ? new Date(dateCreatedTo + 'T23:59:59') : new Date('2100-12-31');
                return userDate >= fromDate && userDate <= toDate;
            });
        }
        // Apply date modified filter
        if (dateModifiedFrom || dateModifiedTo) {
            filteredUsers = filteredUsers.filter(user => {
                const userDate = new Date(user.lastModifiedAt || user.createdAt || '2024-01-01');
                const fromDate = dateModifiedFrom ? new Date(dateModifiedFrom) : new Date('1900-01-01');
                const toDate = dateModifiedTo ? new Date(dateModifiedTo + 'T23:59:59') : new Date('2100-12-31');
                return userDate >= fromDate && userDate <= toDate;
            });
        }
        // Apply advanced search filters
        if (aadhaarNumber) {
            const aadhaarLower = aadhaarNumber.toLowerCase();
            filteredUsers = filteredUsers.filter(user => {
                // Generate mock Aadhaar number based on user ID
                const mockAadhaar = `${user.id.toString().padStart(4, '0')}-${user.id.toString().padStart(4, '0')}-${user.id.toString().padStart(4, '0')}`;
                return mockAadhaar.toLowerCase().includes(aadhaarLower);
            });
        }
        if (addressLine1) {
            const addressLower = addressLine1.toLowerCase();
            filteredUsers = filteredUsers.filter(user => {
                // Use existing address helper or generate mock address
                const addresses = [
                    '123, MG Road', '456, Park Street', '789, Brigade Road',
                    '321, Commercial Street', '654, Linking Road', '987, Church Street',
                    '147, Residency Road', '258, Infantry Road', '369, Richmond Road'
                ];
                const mockAddress = addresses[user.id % addresses.length];
                return mockAddress.toLowerCase().includes(addressLower);
            });
        }
        if (panNumber) {
            const panLower = panNumber.toLowerCase();
            filteredUsers = filteredUsers.filter(user => {
                // Generate mock PAN number
                const panNumbers = [
                    'ABCDE1234F', 'FGHIJ5678K', 'KLMNO9012P', 'PQRST3456U', 'UVWXY7890Z',
                    'BCDEF2345G', 'GHIJK6789L', 'LMNOP0123Q', 'QRSTU4567V', 'VWXYZ8901A'
                ];
                const mockPan = panNumbers[user.id % panNumbers.length];
                return mockPan.toLowerCase().includes(panLower);
            });
        }
        if (emailId) {
            const emailLower = emailId.toLowerCase();
            filteredUsers = filteredUsers.filter(user => user.email?.toLowerCase().includes(emailLower));
        }
        if (mobileNumber) {
            filteredUsers = filteredUsers.filter(user => {
                // Generate mock mobile number
                const mobiles = [
                    '7227349632', '9007548029', '8120479482', '9876543210', '8765432109',
                    '7654321098', '9543210987', '8432109876', '7321098765', '9210987654'
                ];
                const mockMobile = `+91 ${mobiles[user.id % mobiles.length]}`;
                return mockMobile.includes(mobileNumber);
            });
        }
        // Apply sorting: Status priority first, then alphabetical by name
        filteredUsers = filteredUsers.sort((a, b) => {
            // Define status priority order
            const statusPriority = {
                'invite_now': 1,
                'pending': 2,
                'active': 3,
                'suspended': 4,
                'inactive': 4 // Treat inactive same as suspended
            };
            // Get status priorities (default to 5 for unknown statuses)
            const statusA = statusPriority[a.status] || 5;
            const statusB = statusPriority[b.status] || 5;
            // First sort by status priority
            if (statusA !== statusB) {
                return statusA - statusB;
            }
            // If status is the same, sort alphabetically by full name
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });
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
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});
router.get('/:id', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
});
router.post('/', async (req, res) => {
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
        const newUser = {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create client' });
    }
});
router.put('/:id', async (req, res) => {
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
        const updatedUser = {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update client' });
    }
});
router.delete('/:id', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map