// Enhanced database interfaces matching the new ER model

export interface Address {
  id?: number;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city?: string;
  state: string;
  district: string;
  pincode: string;
  country: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Institution {
  id?: number;
  institutionType: 'bank' | 'post_office';
  institutionName: string;
  branchCode?: string;
  ifscCode?: string;
  pinCode?: string;
  addressId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  id?: number;
  clientId: number;
  type: 'email' | 'phone';
  contactPriority?: 'primary' | 'secondary';
  contactDetails: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id?: number;
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  kycNumber?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  addressId?: number;
  linkedClientId?: number;
  linkedClientRelationship?: 'spouse' | 'parent' | 'child' | 'sibling' | 'business_partner' | 'guarantor' | 'other';
  status?: 'invite_now' | 'pending' | 'active' | 'suspended' | 'deleted';
  deletionStatus?: 'active' | 'soft_deleted' | 'hard_deleted';
  createdAt?: string;
  updatedAt?: string;
}

export interface Shop {
  id?: number;
  shopName: string;
  shopType?: string;
  category?: string;
  licenseNumber?: string;
  ownerId: number;
  addressId?: number;
  status?: 'active' | 'pending' | 'suspended' | 'inactive';
  deletionStatus?: 'active' | 'soft_deleted' | 'hard_deleted';
  createdAt?: string;
  updatedAt?: string;
}

export interface Account {
  id?: number;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'fixed_deposit' | 'recurring_deposit' | 'loan';
  accountOwnershipType: 'individual' | 'joint' | 'minor';
  balance?: number;
  interestRate?: number;
  maturityDate?: string;
  institutionId: number;
  status?: 'active' | 'suspended' | 'fined' | 'matured' | 'closed';
  paymentType?: 'monthly' | 'quarterly' | 'yearly' | 'lumpsum';
  deletionStatus?: 'active' | 'soft_deleted' | 'hard_deleted';
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountHolder {
  id?: number;
  accountId: number;
  clientId: number;
  holderType: 'primary' | 'secondary' | 'nominee';
  sharePercentage?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopClient {
  id?: number;
  shopId: number;
  clientId: number;
  relationshipType: 'customer' | 'supplier' | 'partner';
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id?: number;
  accountId: number;
  transactionType: 'deposit' | 'withdrawal' | 'transfer' | 'interest' | 'fee';
  amount: number;
  balanceAfter: number;
  description?: string;
  referenceNumber?: string;
  transactionDate: string;
  status?: 'completed' | 'pending' | 'failed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}



export interface AuditLog {
  id?: number;
  tableName: string;
  recordId: number;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE';
  oldValues?: string; // JSON string
  newValues?: string; // JSON string
  userId?: string;
  timestamp?: string;
}
