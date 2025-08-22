#!/usr/bin/env ts-node

import { cleanupDatabase } from './database/cleanup';

// Run the cleanup
try {
  const result = cleanupDatabase();
  console.log('\n🎉 Database cleanup completed!');
  process.exit(0);
} catch (error) {
  console.error('\n💥 Database cleanup failed:', error);
  process.exit(1);
}
