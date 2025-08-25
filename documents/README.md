# Documents Module

A dedicated microservice for handling all document-related operations in the admin-ui system.

## Features

- **Separate Database**: Independent SQLite database for document metadata
- **File Management**: Secure file storage with hash-based duplicate detection
- **Document Types**: Extensible document type system (PAN, Aadhaar, profile pictures, etc.)
- **Version Control**: Document version history tracking
- **Access Logging**: Comprehensive audit trail for all document operations
- **RESTful API**: Complete REST API for document operations

## Architecture

```
Documents Module
├── Database (documents.db)
│   ├── entities (maps to main app entities)
│   ├── document_types (extensible type system)
│   ├── documents (metadata)
│   ├── document_versions (version history)
│   └── document_access_log (audit trail)
├── File Storage (/uploads)
│   └── {entityType}/{entityId}/{filename}
└── API Endpoints
    ├── /api/documents/upload
    ├── /api/documents/entity/{type}/{id}
    ├── /api/documents/{id}/download
    └── /api/documents/{id}/view
```

## Setup

1. **Install Dependencies**:
   ```bash
   cd documents
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build**:
   ```bash
   npm run build
   ```

4. **Run Migration** (optional - to migrate existing documents):
   ```bash
   npm run migrate
   ```

5. **Start Service**:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Document Upload
```http
POST /api/documents/upload
Content-Type: multipart/form-data

Form fields:
- file: Document file
- entityType: 'client' | 'shop' | 'account'
- externalEntityId: ID from main database
- documentType: 'pan_card' | 'aadhar_card' | etc.
- documentNumber: (optional) Document number
- expiryDate: (optional) Expiry date
- notes: (optional) Notes
```

### Get Documents by Entity
```http
GET /api/documents/entity/{entityType}/{externalEntityId}?documentType={type}
```

### Download Document
```http
GET /api/documents/{documentId}/download
```

### View Document
```http
GET /api/documents/{documentId}/view
```

### Update Document
```http
PUT /api/documents/{documentId}
Content-Type: application/json

{
  "documentNumber": "string",
  "isVerified": boolean,
  "notes": "string"
}
```

## Integration with Main Backend

The main backend now uses the Documents service internally:

1. **Document Service**: `backend/src/services/documentsService.ts` handles communication
2. **Updated Routes**: Client document endpoints now proxy to Documents service
3. **Seamless Migration**: Existing frontend code continues to work unchanged

## Migration

To migrate existing documents from the main backend:

```bash
cd documents
npm run migrate
```

This will:
- Copy all document files to the Documents module
- Transfer metadata to the Documents database
- Maintain file integrity with hash verification
- Preserve all existing document relationships

## Testing

1. **Start Documents Service**:
   ```bash
   cd documents
   npm run dev
   ```

2. **Start Main Backend**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Test Document Operations**:
   - Upload documents via frontend
   - Download/view existing documents
   - Verify files are served correctly

## Environment Variables

- `DOCUMENTS_PORT`: Service port (default: 3002)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS
- `BACKEND_URL`: Main backend URL
- `MAX_FILE_SIZE`: Maximum file size in bytes
- `UPLOAD_DIR`: Upload directory path

## Security

- File type validation based on MIME types
- File size limits per document type
- Hash-based duplicate detection
- Comprehensive access logging
- Secure file serving with proper headers

## Monitoring

- Health check endpoint: `GET /health`
- Access logs for all operations
- Document statistics: `GET /api/documents/stats`
- Expiring documents: `GET /api/documents/expiring/{days}`
