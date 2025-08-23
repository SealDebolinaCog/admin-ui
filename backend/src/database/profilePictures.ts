import { getDatabase } from './database';
import Database from 'better-sqlite3';

export interface ProfilePicture {
  id?: number;
  entityType: 'client' | 'shop' | 'account';
  entityId: number;
  imageType: 'profile' | 'outlet' | 'front_page';
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export class ProfilePictureRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  create(profilePicture: Omit<ProfilePicture, 'id' | 'uploadedAt' | 'updatedAt'>): ProfilePicture {
    const stmt = this.db.prepare(`
      INSERT INTO profile_pictures (entityType, entityId, imageType, fileName, filePath, fileSize, mimeType, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      profilePicture.entityType,
      profilePicture.entityId,
      profilePicture.imageType,
      profilePicture.fileName,
      profilePicture.filePath,
      profilePicture.fileSize || null,
      profilePicture.mimeType || null,
      profilePicture.isActive !== undefined ? profilePicture.isActive : 1
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  findById(id: number): ProfilePicture | null {
    const stmt = this.db.prepare('SELECT * FROM profile_pictures WHERE id = ?');
    return stmt.get(id) as ProfilePicture | null;
  }

  findByEntity(entityType: 'client' | 'shop' | 'account', entityId: number): ProfilePicture[] {
    const stmt = this.db.prepare(`
      SELECT * FROM profile_pictures 
      WHERE entityType = ? AND entityId = ? AND isActive = 1
      ORDER BY uploadedAt DESC
    `);
    return stmt.all(entityType, entityId) as ProfilePicture[];
  }

  findByEntityAndType(
    entityType: 'client' | 'shop' | 'account', 
    entityId: number, 
    imageType: 'profile' | 'outlet' | 'front_page'
  ): ProfilePicture | null {
    const stmt = this.db.prepare(`
      SELECT * FROM profile_pictures 
      WHERE entityType = ? AND entityId = ? AND imageType = ? AND isActive = 1
      ORDER BY uploadedAt DESC
      LIMIT 1
    `);
    return stmt.get(entityType, entityId, imageType) as ProfilePicture | null;
  }

  findAll(filters?: {
    entityType?: 'client' | 'shop' | 'account';
    imageType?: 'profile' | 'outlet' | 'front_page';
    isActive?: boolean;
  }): ProfilePicture[] {
    let query = 'SELECT * FROM profile_pictures WHERE 1=1';
    const params: any[] = [];

    if (filters?.entityType) {
      query += ' AND entityType = ?';
      params.push(filters.entityType);
    }

    if (filters?.imageType) {
      query += ' AND imageType = ?';
      params.push(filters.imageType);
    }

    if (filters?.isActive !== undefined) {
      query += ' AND isActive = ?';
      params.push(filters.isActive ? 1 : 0);
    }

    query += ' ORDER BY uploadedAt DESC';
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as ProfilePicture[];
  }

  update(id: number, profilePicture: Partial<Omit<ProfilePicture, 'id' | 'uploadedAt'>>): ProfilePicture | null {
    const stmt = this.db.prepare(`
      UPDATE profile_pictures 
      SET entityType = COALESCE(?, entityType),
          entityId = COALESCE(?, entityId),
          imageType = COALESCE(?, imageType),
          fileName = COALESCE(?, fileName),
          filePath = COALESCE(?, filePath),
          fileSize = COALESCE(?, fileSize),
          mimeType = COALESCE(?, mimeType),
          isActive = COALESCE(?, isActive),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      profilePicture.entityType || null,
      profilePicture.entityId || null,
      profilePicture.imageType || null,
      profilePicture.fileName || null,
      profilePicture.filePath || null,
      profilePicture.fileSize || null,
      profilePicture.mimeType || null,
      profilePicture.isActive !== undefined ? (profilePicture.isActive ? 1 : 0) : null,
      id
    );

    return result.changes > 0 ? this.findById(id) : null;
  }

  // Soft delete - mark as inactive
  deactivate(id: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE profile_pictures 
      SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Hard delete
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM profile_pictures WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Replace existing image for entity and type
  replaceImage(
    entityType: 'client' | 'shop' | 'account',
    entityId: number,
    imageType: 'profile' | 'outlet' | 'front_page',
    newImage: Omit<ProfilePicture, 'id' | 'entityType' | 'entityId' | 'imageType' | 'uploadedAt' | 'updatedAt'>
  ): ProfilePicture {
    // Deactivate existing image
    const existingStmt = this.db.prepare(`
      UPDATE profile_pictures 
      SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
      WHERE entityType = ? AND entityId = ? AND imageType = ? AND isActive = 1
    `);
    existingStmt.run(entityType, entityId, imageType);

    // Create new image
    return this.create({
      entityType,
      entityId,
      imageType,
      ...newImage
    });
  }

  // Get client profile pictures with client details
  findClientProfilePictures(): any[] {
    const stmt = this.db.prepare(`
      SELECT pp.*, 
             c.firstName, c.lastName, c.email
      FROM profile_pictures pp
      JOIN clients c ON pp.entityId = c.id
      WHERE pp.entityType = 'client' AND pp.isActive = 1
      ORDER BY pp.uploadedAt DESC
    `);
    return stmt.all();
  }

  // Get shop profile pictures with shop details
  findShopProfilePictures(): any[] {
    const stmt = this.db.prepare(`
      SELECT pp.*, 
             s.shopName, s.shopType, s.category
      FROM profile_pictures pp
      JOIN shops s ON pp.entityId = s.id
      WHERE pp.entityType = 'shop' AND pp.isActive = 1
      ORDER BY pp.uploadedAt DESC
    `);
    return stmt.all();
  }

  // Get account profile pictures with account details
  findAccountProfilePictures(): any[] {
    const stmt = this.db.prepare(`
      SELECT pp.*, 
             a.accountNumber, a.accountType,
             i.institutionName, i.institutionType
      FROM profile_pictures pp
      JOIN accounts a ON pp.entityId = a.id
      JOIN institutions i ON a.institutionId = i.id
      WHERE pp.entityType = 'account' AND pp.isActive = 1
      ORDER BY pp.uploadedAt DESC
    `);
    return stmt.all();
  }

  // Get storage statistics
  getStorageStats(): any {
    const stmt = this.db.prepare(`
      SELECT 
        entityType,
        imageType,
        COUNT(*) as count,
        SUM(fileSize) as totalSize,
        AVG(fileSize) as avgSize
      FROM profile_pictures 
      WHERE isActive = 1 AND fileSize IS NOT NULL
      GROUP BY entityType, imageType
      ORDER BY entityType, imageType
    `);
    return stmt.all();
  }
}
