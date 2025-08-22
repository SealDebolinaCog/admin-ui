# Admin UI - Entity Relationship Diagram

## Database Schema Analysis

This ER diagram represents the data model for the Admin UI application, which manages clients, shops, and financial accounts.

```mermaid
erDiagram
    CLIENTS {
        int id PK "Auto-increment primary key"
        text firstName "Required"
        text lastName "Required"
        text email "Unique, optional"
        text phone "Optional"
        text kycNumber "KYC identification"
        text panNumber "PAN card number"
        text aadhaarNumber "Aadhaar card number"
        text addressLine1 "Address line 1"
        text addressLine2 "Address line 2"
        text addressLine3 "Address line 3"
        text state "State/Province"
        text district "District"
        text pincode "Postal code"
        text country "Default: India"
        text status "invite_now|pending|active|suspended|deleted"
        text linkedClientId "Reference to related client"
        text linkedClientName "Name of linked client"
        text linkedClientRelationship "Relationship type"
        datetime createdAt "Auto-generated"
        datetime updatedAt "Auto-updated"
    }

    SHOPS {
        int id PK "Auto-increment primary key"
        text shopName "Required shop name"
        text shopType "Type of shop"
        text category "Business category"
        text status "active|pending|suspended|inactive"
        text ownerName "Required owner name"
        text ownerEmail "Owner email"
        text ownerPhone "Owner phone"
        text addressLine1 "Shop address line 1"
        text addressLine2 "Shop address line 2"
        text addressLine3 "Shop address line 3"
        text state "State/Province"
        text district "District"
        text pincode "Postal code"
        text country "Default: India"
        datetime createdAt "Auto-generated"
        datetime updatedAt "Auto-updated"
    }

    ACCOUNTS {
        int id PK "Auto-increment primary key"
        text accountNumber UK "Unique account number"
        text accountOwnershipType "single|joint"
        text accountHolderNames "JSON array of holder names"
        text institutionType "bank|post_office"
        text accountType "Required account type"
        text institutionName "Required institution name"
        text branchCode "Branch identifier"
        text ifscCode "IFSC code for banks"
        int tenure "Duration in months, default: 12"
        text status "active|suspended|fined|matured|closed"
        text startDate "Account start date"
        text maturityDate "Account maturity date"
        text paymentType "monthly|annually|one_time"
        real amount "Account amount, default: 0"
        text lastPaymentDate "Last payment date"
        text nomineeName "Nominee name"
        text nomineeRelation "Nominee relationship"
        datetime createdAt "Auto-generated"
        datetime updatedAt "Auto-updated"
    }

    %% Self-referencing relationship for clients
    CLIENTS ||--o{ CLIENTS : "linked_to"
```

## Entity Descriptions

### **CLIENTS**
- **Purpose**: Manages customer/client information
- **Key Features**:
  - Personal information (name, contact details)
  - Identity documents (KYC, PAN, Aadhaar)
  - Address information
  - Status tracking for client lifecycle
  - Self-referencing relationship for linked clients (family members, etc.)

### **SHOPS** 
- **Purpose**: Manages shop/business information
- **Key Features**:
  - Shop details (name, type, category)
  - Owner information
  - Business address
  - Status tracking for shop lifecycle
  - Independent entity with no direct relationships to other tables

### **ACCOUNTS**
- **Purpose**: Manages financial accounts (bank/post office)
- **Key Features**:
  - Account details (number, type, institution)
  - Ownership information (single/joint accounts)
  - Financial terms (tenure, amount, payment schedule)
  - Nominee information
  - Status tracking for account lifecycle
  - Independent entity with no direct foreign key relationships

## Key Observations

1. **No Foreign Key Relationships**: The current schema doesn't have explicit foreign key relationships between entities, suggesting they operate independently.

2. **Self-Referencing Client Relationship**: Clients can be linked to other clients through `linkedClientId`, `linkedClientName`, and `linkedClientRelationship` fields.

3. **JSON Storage**: Account holder names are stored as JSON arrays to support multiple holders for joint accounts.

4. **Status Management**: All entities have status fields for lifecycle management.

5. **Audit Trail**: All entities include `createdAt` and `updatedAt` timestamps.

6. **Geographic Information**: Both clients and shops store detailed address information including state, district, and pincode.

## Potential Enhancements

- **Add Relationships**: Consider adding foreign key relationships between clients and accounts, or shops and their owners
- **Normalize Data**: Extract common address information into a separate address entity
- **Add Transaction History**: Consider adding transaction or payment history tables
- **User Management**: Add user authentication and role management tables
