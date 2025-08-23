import { AddressRepository } from './addresses';
import { InstitutionRepository } from './institutions';
import { ClientRepository } from './clients';
import { AccountRepository } from './accounts';
import { AccountHolderRepository } from './accountHolders';
import { TransactionRepository } from './transactions';
import { AuditLogRepository } from './auditLog';
import { ProfilePictureRepository } from './profilePictures';
import { DocumentRepository } from './documents';

export async function setupMockData() {
  console.log('Setting up mock data...');

  const addressRepo = new AddressRepository();
  const institutionRepo = new InstitutionRepository();
  const clientRepo = new ClientRepository();
  const accountRepo = new AccountRepository();
  const accountHolderRepo = new AccountHolderRepository();
  const transactionRepo = new TransactionRepository();
  const auditRepo = new AuditLogRepository();
  const profilePictureRepo = new ProfilePictureRepository();
  const documentRepo = new DocumentRepository();

  try {
    // Create sample addresses
    const address1 = addressRepo.create({
      addressLine1: '123 Main Street',
      addressLine2: 'Apartment 4B',
      state: 'Maharashtra',
      district: 'Mumbai',
      pincode: '400001',
      country: 'India'
    });

    const address2 = addressRepo.create({
      addressLine1: '456 Park Avenue',
      state: 'Karnataka',
      district: 'Bangalore',
      pincode: '560001',
      country: 'India'
    });

    const address3 = addressRepo.create({
      addressLine1: '789 Commercial Complex',
      addressLine2: 'Shop No. 15',
      state: 'Delhi',
      district: 'New Delhi',
      pincode: '110001',
      country: 'India'
    });

    // Create sample institutions
    const bank1 = institutionRepo.create({
      institutionName: 'State Bank of India',
      institutionType: 'bank',
      branchCode: 'SBI001',
      ifscCode: 'SBIN0000123',
      addressId: address1.id
    });

    const postOffice1 = institutionRepo.create({
      institutionName: 'Mumbai Central Post Office',
      institutionType: 'post_office',
      branchCode: 'PO001',
      addressId: address2.id
    });

    const bank2 = institutionRepo.create({
      institutionName: 'HDFC Bank',
      institutionType: 'bank',
      branchCode: 'HDFC001',
      ifscCode: 'HDFC0000456',
      addressId: address3.id
    });

    // Create sample clients
    const client1 = clientRepo.create({
      title: 'Mr.',
      firstName: 'Rajesh',
      middleName: 'Kumar',
      lastName: 'Sharma',
      email: 'rajesh.sharma@email.com',
      phone: '+91-9876543210',
      kycNumber: 'KYC001',
      panNumber: 'ABCDE1234F',
      aadhaarNumber: '123456789012',
      addressId: address1.id,
      status: 'active'
    });

    const client2 = clientRepo.create({
      title: 'Mrs.',
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@email.com',
      phone: '+91-9876543211',
      kycNumber: 'KYC002',
      panNumber: 'FGHIJ5678K',
      aadhaarNumber: '123456789013',
      addressId: address2.id,
      status: 'active'
    });

    const client3 = clientRepo.create({
      title: 'Mr.',
      firstName: 'Amit',
      lastName: 'Singh',
      email: 'amit.singh@email.com',
      phone: '+91-9876543212',
      kycNumber: 'KYC003',
      panNumber: 'LMNOP9012Q',
      aadhaarNumber: '123456789014',
      addressId: address3.id,
      status: 'active',
      linkedClientId: client1.id,
      linkedClientRelationship: 'Brother'
    });

    // Create sample accounts
    const account1 = accountRepo.create({
      accountNumber: 'SBI123456789',
      accountOwnershipType: 'joint',
      accountType: 'Savings',
      institutionId: bank1.id!,
      tenure: 12,
      status: 'active',
      startDate: '2024-01-01',
      maturityDate: '2025-01-01',
      paymentType: 'monthly',
      amount: 50000.00,
      nomineeName: 'Sunita Sharma',
      nomineeRelation: 'Wife'
    });

    const account2 = accountRepo.create({
      accountNumber: 'PO987654321',
      accountOwnershipType: 'single',
      accountType: 'Fixed Deposit',
      institutionId: postOffice1.id!,
      tenure: 24,
      status: 'active',
      startDate: '2024-02-01',
      maturityDate: '2026-02-01',
      paymentType: 'annually',
      amount: 100000.00,
      nomineeName: 'Rahul Patel',
      nomineeRelation: 'Son'
    });

    const account3 = accountRepo.create({
      accountNumber: 'HDFC555666777',
      accountOwnershipType: 'joint',
      accountType: 'Recurring Deposit',
      institutionId: bank2.id!,
      tenure: 36,
      status: 'active',
      startDate: '2024-03-01',
      maturityDate: '2027-03-01',
      paymentType: 'monthly',
      amount: 25000.00,
      nomineeName: 'Kavita Singh',
      nomineeRelation: 'Wife'
    });

    // Create account holders (many-to-many relationships)
    accountHolderRepo.create({
      accountId: account1.id!,
      clientId: client1.id!,
      holderType: 'primary'
    });

    accountHolderRepo.create({
      accountId: account1.id!,
      clientId: client2.id!,
      holderType: 'secondary'
    });

    accountHolderRepo.create({
      accountId: account2.id!,
      clientId: client2.id!,
      holderType: 'primary'
    });

    accountHolderRepo.create({
      accountId: account3.id!,
      clientId: client3.id!,
      holderType: 'primary'
    });

    accountHolderRepo.create({
      accountId: account3.id!,
      clientId: client1.id!,
      holderType: 'secondary'
    });

    // Create sample transactions
    const transactions = [
      // Account 1 transactions
      {
        accountId: account1.id!,
        transactionType: 'deposit' as const,
        amount: 10000.00,
        transactionDate: '2024-01-15',
        description: 'Initial deposit',
        referenceNumber: 'TXN001',
        status: 'completed' as const
      },
      {
        accountId: account1.id!,
        transactionType: 'deposit' as const,
        amount: 5000.00,
        transactionDate: '2024-02-15',
        description: 'Monthly deposit',
        referenceNumber: 'TXN002',
        status: 'completed' as const
      },
      {
        accountId: account1.id!,
        transactionType: 'interest' as const,
        amount: 150.00,
        transactionDate: '2024-03-01',
        description: 'Monthly interest credit',
        referenceNumber: 'INT001',
        status: 'completed' as const
      },
      {
        accountId: account1.id!,
        transactionType: 'withdrawal' as const,
        amount: 2000.00,
        transactionDate: '2024-03-15',
        description: 'ATM withdrawal',
        referenceNumber: 'WTH001',
        status: 'completed' as const
      },

      // Account 2 transactions
      {
        accountId: account2.id!,
        transactionType: 'deposit' as const,
        amount: 100000.00,
        transactionDate: '2024-02-01',
        description: 'Fixed deposit opening',
        referenceNumber: 'FD001',
        status: 'completed' as const
      },
      {
        accountId: account2.id!,
        transactionType: 'interest' as const,
        amount: 8333.33,
        transactionDate: '2024-08-01',
        description: 'Half-yearly interest',
        referenceNumber: 'INT002',
        status: 'completed' as const
      },

      // Account 3 transactions
      {
        accountId: account3.id!,
        transactionType: 'deposit' as const,
        amount: 5000.00,
        transactionDate: '2024-03-01',
        description: 'RD monthly installment',
        referenceNumber: 'RD001',
        status: 'completed' as const
      },
      {
        accountId: account3.id!,
        transactionType: 'deposit' as const,
        amount: 5000.00,
        transactionDate: '2024-04-01',
        description: 'RD monthly installment',
        referenceNumber: 'RD002',
        status: 'completed' as const
      },
      {
        accountId: account3.id!,
        transactionType: 'deposit' as const,
        amount: 5000.00,
        transactionDate: '2024-05-01',
        description: 'RD monthly installment',
        referenceNumber: 'RD003',
        status: 'completed' as const
      },
      {
        accountId: account3.id!,
        transactionType: 'penalty' as const,
        amount: 100.00,
        transactionDate: '2024-06-05',
        description: 'Late payment penalty',
        referenceNumber: 'PEN001',
        status: 'completed' as const
      }
    ];

    // Insert all transactions
    for (const txn of transactions) {
      transactionRepo.create(txn);
    }

    // Create some audit log entries
    auditRepo.logChange('clients', client1.id!, 'INSERT', null, client1, 'system');
    auditRepo.logChange('accounts', account1.id!, 'INSERT', null, account1, 'system');
    auditRepo.logChange('transactions', 1, 'INSERT', null, transactions[0], 'system');

    // Create sample profile pictures
    const clientProfilePic1 = profilePictureRepo.create({
      entityType: 'client',
      entityId: client1.id!,
      imageType: 'profile',
      fileName: 'rajesh_profile.jpg',
      filePath: '/uploads/clients/rajesh_profile.jpg',
      fileSize: 245760,
      mimeType: 'image/jpeg'
    });

    const clientProfilePic2 = profilePictureRepo.create({
      entityType: 'client',
      entityId: client2.id!,
      imageType: 'profile',
      fileName: 'priya_profile.png',
      filePath: '/uploads/clients/priya_profile.png',
      fileSize: 189440,
      mimeType: 'image/png'
    });

    const shopOutletPic = profilePictureRepo.create({
      entityType: 'shop',
      entityId: 1, // Assuming we'll create shops later
      imageType: 'outlet',
      fileName: 'shop_outlet_front.jpg',
      filePath: '/uploads/shops/shop_outlet_front.jpg',
      fileSize: 512000,
      mimeType: 'image/jpeg'
    });

    const accountFrontPage = profilePictureRepo.create({
      entityType: 'account',
      entityId: account1.id!,
      imageType: 'front_page',
      fileName: 'account_passbook_front.jpg',
      filePath: '/uploads/accounts/account_passbook_front.jpg',
      fileSize: 367890,
      mimeType: 'image/jpeg'
    });

    // Create sample documents
    const clientPanCard = documentRepo.create({
      entityType: 'client',
      entityId: client1.id!,
      documentType: 'pan_card',
      documentNumber: 'ABCDE1234F',
      fileName: 'rajesh_pan_card.pdf',
      filePath: '/uploads/documents/clients/rajesh_pan_card.pdf',
      fileSize: 156780,
      mimeType: 'application/pdf',
      isVerified: 1,
      verifiedBy: 'admin',
      verifiedAt: '2025-08-20 10:30:00'
    });

    const clientAadhar = documentRepo.create({
      entityType: 'client',
      entityId: client1.id!,
      documentType: 'aadhar_card',
      documentNumber: '1234-5678-9012',
      fileName: 'rajesh_aadhar.jpg',
      filePath: '/uploads/documents/clients/rajesh_aadhar.jpg',
      fileSize: 245600,
      mimeType: 'image/jpeg',
      isVerified: 1,
      verifiedBy: 'admin',
      verifiedAt: '2025-08-20 10:35:00'
    });

    const client2Passport = documentRepo.create({
      entityType: 'client',
      entityId: client2.id!,
      documentType: 'passport',
      documentNumber: 'M1234567',
      fileName: 'priya_passport.pdf',
      filePath: '/uploads/documents/clients/priya_passport.pdf',
      fileSize: 890450,
      mimeType: 'application/pdf',
      expiryDate: '2030-12-15',
      isVerified: 0,
      notes: 'Pending verification - submitted today'
    });

    const accountPassbook = documentRepo.create({
      entityType: 'account',
      entityId: account1.id!,
      documentType: 'passbook_page',
      fileName: 'account_passbook_page1.jpg',
      filePath: '/uploads/documents/accounts/account_passbook_page1.jpg',
      fileSize: 445670,
      mimeType: 'image/jpeg',
      isVerified: 1,
      verifiedBy: 'system',
      verifiedAt: '2025-08-22 14:20:00'
    });

    const accountStatement = documentRepo.create({
      entityType: 'account',
      entityId: account2.id!,
      documentType: 'statement',
      fileName: 'account_statement_july2025.pdf',
      filePath: '/uploads/documents/accounts/account_statement_july2025.pdf',
      fileSize: 234890,
      mimeType: 'application/pdf',
      isVerified: 1,
      verifiedBy: 'system',
      verifiedAt: '2025-08-01 09:00:00'
    });

    const fdReceipt = documentRepo.create({
      entityType: 'account',
      entityId: account3.id!,
      documentType: 'fd_receipt',
      fileName: 'fd_receipt_12345.pdf',
      filePath: '/uploads/documents/accounts/fd_receipt_12345.pdf',
      fileSize: 178900,
      mimeType: 'application/pdf',
      isVerified: 1,
      verifiedBy: 'branch_manager',
      verifiedAt: '2025-08-15 16:45:00',
      notes: 'Fixed deposit maturity: 2026-08-15'
    });

    console.log('Mock data setup completed successfully!');
    console.log(`Created:
    - ${3} addresses
    - ${3} institutions (2 banks, 1 post office)
    - ${3} clients
    - ${3} accounts
    - ${5} account holder relationships
    - ${10} transactions
    - ${4} profile pictures
    - ${6} documents
    - ${3} audit log entries`);

    return {
      addresses: [address1, address2, address3],
      institutions: [bank1, postOffice1, bank2],
      clients: [client1, client2, client3],
      accounts: [account1, account2, account3],
      transactionCount: transactions.length
    };

  } catch (error) {
    console.error('Error setting up mock data:', error);
    throw error;
  }
}

export async function testDatabaseOperations() {
  console.log('\n=== Testing Database Operations ===');

  const transactionRepo = new TransactionRepository();
  const accountHolderRepo = new AccountHolderRepository();
  const auditRepo = new AuditLogRepository();
  const profilePictureRepo = new ProfilePictureRepository();
  const documentRepo = new DocumentRepository();

  try {
    // Test transaction queries
    console.log('\n--- Transaction Tests ---');
    const allTransactions = transactionRepo.findWithAccountDetails();
    console.log(`Total transactions: ${allTransactions.length}`);

    const account1Transactions = transactionRepo.findByAccountId(1);
    console.log(`Account 1 transactions: ${account1Transactions.length}`);

    const balance = transactionRepo.getAccountBalance(1);
    console.log(`Account 1 balance: ₹${balance.toFixed(2)}`);

    const summary = transactionRepo.getTransactionSummary(1);
    console.log('Account 1 transaction summary:', summary);

    // Test account holder relationships
    console.log('\n--- Account Holder Tests ---');
    const account1Holders = accountHolderRepo.findAccountHoldersWithDetails(1);
    console.log(`Account 1 holders:`, account1Holders);

    const client1Accounts = accountHolderRepo.findClientAccountsWithDetails(1);
    console.log(`Client 1 accounts:`, client1Accounts);

    // Test audit log
    console.log('\n--- Audit Log Tests ---');
    const recentAudits = auditRepo.findAll(5);
    console.log(`Recent audit entries: ${recentAudits.length}`);

    // Test profile pictures
    console.log('\n--- Profile Picture Tests ---');
    const clientPictures = profilePictureRepo.findByEntity('client', 1);
    console.log(`Client 1 profile pictures: ${clientPictures.length}`);

    const allProfilePictures = profilePictureRepo.findAll();
    console.log(`Total profile pictures: ${allProfilePictures.length}`);

    const clientProfilePicsWithDetails = profilePictureRepo.findClientProfilePictures();
    console.log('Client profile pictures with details:', clientProfilePicsWithDetails);

    const storageStats = profilePictureRepo.getStorageStats();
    console.log('Storage statistics:', storageStats);

    // Test documents
    console.log('\n--- Document Tests ---');
    const clientDocuments = documentRepo.findByEntity('client', 1);
    console.log(`Client 1 documents: ${clientDocuments.length}`);

    const allDocuments = documentRepo.findAll();
    console.log(`Total documents: ${allDocuments.length}`);

    const verifiedDocuments = documentRepo.findByVerificationStatus(true);
    console.log(`Verified documents: ${verifiedDocuments.length}`);

    const unverifiedDocuments = documentRepo.findByVerificationStatus(false);
    console.log(`Unverified documents: ${unverifiedDocuments.length}`);

    const clientDocsWithDetails = documentRepo.findClientDocumentsWithDetails();
    console.log('Client documents with details:', clientDocsWithDetails);

    const accountDocsWithDetails = documentRepo.findAccountDocumentsWithDetails();
    console.log('Account documents with details:', accountDocsWithDetails);

    const documentStats = documentRepo.getDocumentStats();
    console.log('Document statistics:', documentStats);

    const expiringDocs = documentRepo.findExpiringDocuments(365); // Within 1 year
    console.log(`Documents expiring within 1 year: ${expiringDocs.length}`);

    console.log('\n=== Database Operations Test Completed Successfully ===');

  } catch (error) {
    console.error('Error testing database operations:', error);
    throw error;
  }
}
