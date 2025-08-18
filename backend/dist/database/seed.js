"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const index_1 = require("./index");
async function seedDatabase() {
    console.log('Seeding database with initial data...');
    const clientRepo = new index_1.ClientRepository();
    const shopRepo = new index_1.ShopRepository();
    const accountRepo = new index_1.AccountRepository();
    // Check if data already exists
    if (clientRepo.getCount() > 0) {
        console.log('Database already has data, skipping seed...');
        return;
    }
    // Seed Clients
    const sampleClients = [
        {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '9876543210',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            state: 'Maharashtra',
            district: 'Mumbai',
            pincode: '400001',
            nomineeName: 'Jane Doe',
            nomineeRelation: 'Spouse',
            status: 'active'
        },
        {
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice.johnson@example.com',
            phone: '8765432109',
            addressLine1: '456 Park Avenue',
            addressLine2: 'Suite 10',
            state: 'Delhi',
            district: 'New Delhi',
            pincode: '110001',
            nomineeName: 'Bob Johnson',
            nomineeRelation: 'Father',
            status: 'active'
        },
        {
            firstName: 'Michael',
            lastName: 'Brown',
            email: 'michael.brown@example.com',
            phone: '7654321098',
            addressLine1: '789 Oak Road',
            state: 'Karnataka',
            district: 'Bangalore',
            pincode: '560001',
            nomineeName: 'Sarah Brown',
            nomineeRelation: 'Sister',
            status: 'suspended'
        }
    ];
    sampleClients.forEach(client => {
        clientRepo.create(client);
    });
    // Seed Shops
    const sampleShops = [
        {
            shopName: 'Tech Solutions Ltd',
            shopType: 'Technology',
            category: 'Software Development',
            status: 'active',
            ownerName: 'David Wilson',
            ownerEmail: 'david@techsolutions.com',
            ownerPhone: '6543210987',
            addressLine1: '321 Tech Park',
            addressLine2: 'Floor 5',
            state: 'Maharashtra',
            district: 'Pune',
            pincode: '411001'
        },
        {
            shopName: 'Green Grocers',
            shopType: 'Retail',
            category: 'Food & Beverages',
            status: 'active',
            ownerName: 'Emma Davis',
            ownerEmail: 'emma@greengrocers.com',
            ownerPhone: '5432109876',
            addressLine1: '654 Market Street',
            state: 'West Bengal',
            district: 'Kolkata',
            pincode: '700001'
        },
        {
            shopName: 'Fashion Forward',
            shopType: 'Retail',
            category: 'Clothing',
            status: 'suspended',
            ownerName: 'Lisa Anderson',
            ownerEmail: 'lisa@fashionforward.com',
            ownerPhone: '4321098765',
            addressLine1: '987 Style Avenue',
            addressLine2: 'Unit 3',
            state: 'Tamil Nadu',
            district: 'Chennai',
            pincode: '600001'
        }
    ];
    sampleShops.forEach(shop => {
        shopRepo.create(shop);
    });
    // Seed Accounts
    const sampleAccounts = [
        {
            accountNumber: 'ACC001',
            accountOwnershipType: 'joint',
            accountHolderNames: ['John Doe', 'Jane Doe'],
            institutionType: 'bank',
            accountType: 'savings',
            institutionName: 'State Bank of India',
            branchCode: 'SBI001',
            ifscCode: 'SBIN0001234',
            tenure: 0,
            status: 'active',
            startDate: '2024-01-01',
            paymentType: 'monthly',
            amount: 10000,
            lastPaymentDate: '2024-01-15',
            nomineeName: 'Mike Doe',
            nomineeRelation: 'Son'
        },
        {
            accountNumber: 'ACC002',
            accountOwnershipType: 'single',
            accountHolderNames: ['Alice Johnson'],
            institutionType: 'post_office',
            accountType: 'recurring_deposit',
            institutionName: 'Aranghata Post Office',
            branchCode: '102024',
            tenure: 60,
            status: 'active',
            startDate: '2024-01-01',
            maturityDate: '2029-01-01',
            paymentType: 'monthly',
            amount: 5000,
            lastPaymentDate: '2024-01-20',
            nomineeName: 'Bob Johnson',
            nomineeRelation: 'Father'
        },
        {
            accountNumber: 'ACC003',
            accountOwnershipType: 'joint',
            accountHolderNames: ['Michael Brown', 'Sarah Brown'],
            institutionType: 'post_office',
            accountType: '1td',
            institutionName: 'Central Post Office',
            branchCode: '999999',
            tenure: 12,
            status: 'matured',
            startDate: '2023-01-01',
            maturityDate: '2024-01-01',
            paymentType: 'one_time',
            amount: 100000,
            nomineeName: 'Tom Brown',
            nomineeRelation: 'Brother'
        }
    ];
    sampleAccounts.forEach(account => {
        accountRepo.create(account);
    });
    console.log('Database seeded successfully!');
    console.log(`Created ${sampleClients.length} clients`);
    console.log(`Created ${sampleShops.length} shops`);
    console.log(`Created ${sampleAccounts.length} accounts`);
}
//# sourceMappingURL=seed.js.map