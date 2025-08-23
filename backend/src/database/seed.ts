import { getDatabase } from './database';

export async function seedDatabase() {
  console.log('Seeding enhanced database with normalized data...');

  const db = getDatabase();

  // Check if data already exists
  const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
  if (clientCount.count > 0) {
    console.log('Database already has data, skipping seed...');
    return;
  }

  // Seed Addresses first
  const addressInsert = db.prepare(`
    INSERT INTO addresses (addressLine1, addressLine2, state, district, pincode, country)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const addresses = [
    { addressLine1: '123 Main Street', addressLine2: 'Apt 4B', state: 'Maharashtra', district: 'Mumbai', pincode: '400001', country: 'India' },
    { addressLine1: '456 Park Avenue', addressLine2: 'Suite 10', state: 'Delhi', district: 'New Delhi', pincode: '110001', country: 'India' },
    { addressLine1: '789 Oak Road', addressLine2: null, state: 'Karnataka', district: 'Bangalore', pincode: '560001', country: 'India' },
    { addressLine1: '321 Tech Park', addressLine2: 'Floor 5', state: 'Maharashtra', district: 'Pune', pincode: '411001', country: 'India' },
    { addressLine1: '654 Market Street', addressLine2: null, state: 'West Bengal', district: 'Kolkata', pincode: '700001', country: 'India' },
    { addressLine1: '987 Style Avenue', addressLine2: 'Unit 3', state: 'Tamil Nadu', district: 'Chennai', pincode: '600001', country: 'India' },
    { addressLine1: '456 Approval Lane', addressLine2: null, state: 'Karnataka', district: 'Bangalore', pincode: '560002', country: 'India' },
    { addressLine1: '789 Closed Street', addressLine2: null, state: 'Delhi', district: 'New Delhi', pincode: '110002', country: 'India' },
    { addressLine1: 'SBI Branch Complex', addressLine2: 'Commercial Area', state: 'Maharashtra', district: 'Mumbai', pincode: '400001', country: 'India' },
    { addressLine1: 'Post Office Building', addressLine2: 'Main Road', state: 'West Bengal', district: 'Aranghata', pincode: '743349', country: 'India' },
    { addressLine1: 'Central Post Office', addressLine2: 'Government Complex', state: 'Delhi', district: 'New Delhi', pincode: '110001', country: 'India' }
  ];

  addresses.forEach(addr => {
    addressInsert.run(addr.addressLine1, addr.addressLine2, addr.state, addr.district, addr.pincode, addr.country);
  });

  // Seed Institutions
  const institutionInsert = db.prepare(`
    INSERT INTO institutions (institutionType, institutionName, branchCode, ifscCode, pinCode, addressId)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const institutions = [
    { institutionType: 'bank', institutionName: 'State Bank of India', branchCode: 'SBI001', ifscCode: 'SBIN0001234', pinCode: null, addressId: 9 },
    { institutionType: 'post_office', institutionName: 'Aranghata Post Office', branchCode: '102024', ifscCode: null, pinCode: '743349', addressId: 10 },
    { institutionType: 'post_office', institutionName: 'Central Post Office', branchCode: '999999', ifscCode: null, pinCode: '110001', addressId: 11 }
  ];

  institutions.forEach(inst => {
    institutionInsert.run(inst.institutionType, inst.institutionName, inst.branchCode, inst.ifscCode, inst.pinCode, inst.addressId);
  });

  // Seed Clients
  const clientInsert = db.prepare(`
    INSERT INTO clients (firstName, lastName, email, phoneNumber, dateOfBirth, gender, occupation, addressId, linkedClientId, deletionStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const clients = [
    { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phoneNumber: '9876543210', dateOfBirth: '1985-06-15', gender: 'Male', occupation: 'Software Engineer', addressId: 1, linkedClientId: null },
    { firstName: 'Alice', lastName: 'Johnson', email: 'alice.johnson@example.com', phoneNumber: '8765432109', dateOfBirth: '1987-03-22', gender: 'Female', occupation: 'Teacher', addressId: 2, linkedClientId: 1 },
    { firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@example.com', phoneNumber: '7654321098', dateOfBirth: '1982-11-08', gender: 'Male', occupation: 'Business Owner', addressId: 3, linkedClientId: null },
    { firstName: 'David', lastName: 'Wilson', email: 'david@techsolutions.com', phoneNumber: '6543210987', dateOfBirth: '1980-09-12', gender: 'Male', occupation: 'Entrepreneur', addressId: 4, linkedClientId: null },
    { firstName: 'Emma', lastName: 'Davis', email: 'emma@greengrocers.com', phoneNumber: '5432109876', dateOfBirth: '1990-01-25', gender: 'Female', occupation: 'Shop Owner', addressId: 5, linkedClientId: null }
  ];

  clients.forEach(client => {
    clientInsert.run(client.firstName, client.lastName, client.email, client.phoneNumber, client.dateOfBirth, client.gender, client.occupation, client.addressId, client.linkedClientId, 'active');
  });

  // Update linked client relationships
  db.prepare('UPDATE clients SET linkedClientId = 2 WHERE id = 1').run();

  // Seed Shops
  const shopInsert = db.prepare(`
    INSERT INTO shops (shopName, shopType, licenseNumber, ownerId, addressId, deletionStatus)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const shops = [
    { shopName: 'Tech Solutions Ltd', shopType: 'Technology', licenseNumber: 'LIC001234', ownerId: 4, addressId: 4 },
    { shopName: 'Green Grocers', shopType: 'Retail', licenseNumber: 'LIC005678', ownerId: 5, addressId: 5 },
    { shopName: 'Fashion Forward', shopType: 'Retail', licenseNumber: 'LIC009876', ownerId: 3, addressId: 6 }
  ];

  shops.forEach(shop => {
    shopInsert.run(shop.shopName, shop.shopType, shop.licenseNumber, shop.ownerId, shop.addressId, 'active');
  });

  // Seed Accounts
  const accountInsert = db.prepare(`
    INSERT INTO accounts (accountNumber, accountType, accountOwnershipType, balance, interestRate, maturityDate, institutionId, deletionStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const accounts = [
    { accountNumber: 'ACC001', accountType: 'savings', accountOwnershipType: 'joint', balance: 10000.00, interestRate: 4.5, maturityDate: null, institutionId: 1 },
    { accountNumber: 'ACC002', accountType: 'recurring_deposit', accountOwnershipType: 'individual', balance: 5000.00, interestRate: 6.8, maturityDate: '2029-01-01', institutionId: 2 },
    { accountNumber: 'ACC003', accountType: 'fixed_deposit', accountOwnershipType: 'joint', balance: 100000.00, interestRate: 7.2, maturityDate: '2024-01-01', institutionId: 3 }
  ];

  accounts.forEach(account => {
    accountInsert.run(account.accountNumber, account.accountType, account.accountOwnershipType, account.balance, account.interestRate, account.maturityDate, account.institutionId, 'active');
  });

  // Seed Account Holders
  const accountHolderInsert = db.prepare(`
    INSERT INTO account_holders (accountId, clientId, holderType, sharePercentage)
    VALUES (?, ?, ?, ?)
  `);

  const accountHolders = [
    { accountId: 1, clientId: 1, holderType: 'primary', sharePercentage: 60.0 },
    { accountId: 1, clientId: 2, holderType: 'secondary', sharePercentage: 40.0 },
    { accountId: 2, clientId: 2, holderType: 'primary', sharePercentage: 100.0 },
    { accountId: 3, clientId: 3, holderType: 'primary', sharePercentage: 100.0 }
  ];

  accountHolders.forEach(holder => {
    accountHolderInsert.run(holder.accountId, holder.clientId, holder.holderType, holder.sharePercentage);
  });

  // Seed Shop-Client relationships
  const shopClientInsert = db.prepare(`
    INSERT INTO shop_clients (shopId, clientId, relationshipType)
    VALUES (?, ?, ?)
  `);

  const shopClients = [
    { shopId: 1, clientId: 1, relationshipType: 'customer' },
    { shopId: 1, clientId: 2, relationshipType: 'customer' },
    { shopId: 2, clientId: 1, relationshipType: 'customer' },
    { shopId: 2, clientId: 3, relationshipType: 'supplier' }
  ];

  shopClients.forEach(sc => {
    shopClientInsert.run(sc.shopId, sc.clientId, sc.relationshipType);
  });

  // Seed sample transactions
  const transactionInsert = db.prepare(`
    INSERT INTO transactions (accountId, transactionType, amount, balanceAfter, description, referenceNumber, transactionDate, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transactions = [
    { accountId: 1, transactionType: 'deposit', amount: 5000.00, balanceAfter: 15000.00, description: 'Initial deposit', referenceNumber: 'TXN001', transactionDate: '2024-01-01', status: 'completed' },
    { accountId: 1, transactionType: 'withdrawal', amount: 2000.00, balanceAfter: 13000.00, description: 'ATM withdrawal', referenceNumber: 'TXN002', transactionDate: '2024-01-15', status: 'completed' },
    { accountId: 2, transactionType: 'deposit', amount: 1000.00, balanceAfter: 6000.00, description: 'Monthly RD payment', referenceNumber: 'TXN003', transactionDate: '2024-01-20', status: 'completed' }
  ];

  transactions.forEach(txn => {
    transactionInsert.run(txn.accountId, txn.transactionType, txn.amount, txn.balanceAfter, txn.description, txn.referenceNumber, txn.transactionDate, txn.status);
  });

  console.log('Enhanced database seeded successfully!');
  console.log(`Created ${addresses.length} addresses`);
  console.log(`Created ${institutions.length} institutions`);
  console.log(`Created ${clients.length} clients`);
  console.log(`Created ${shops.length} shops`);
  console.log(`Created ${accounts.length} accounts`);
  console.log(`Created ${accountHolders.length} account holder relationships`);
  console.log(`Created ${shopClients.length} shop-client relationships`);
  console.log(`Created ${transactions.length} sample transactions`);
} 