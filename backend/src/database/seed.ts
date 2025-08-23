// Seed database functionality - currently disabled
// This file contains seed data for development/testing purposes
// To enable seeding, import and call seedDatabase() from index.ts

export async function seedDatabase() {
  console.log('Database seeding is currently disabled.');
  console.log('To enable seeding, uncomment the seed data implementation below.');
  return;
  
  // Seed implementation commented out to prevent accidental data insertion
  /*
  const db = getDatabase();
  
  // Check if data already exists
  const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
  if (clientCount.count > 0) {
    console.log('Database already has data, skipping seed...');
    return;
  }
  
  // Add your seed data implementation here when needed
  console.log('Enhanced database seeded successfully!');
  */
} 