import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Test database connection
export const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

// Clean up database before each test suite
beforeAll(async () => {
  // Optionally run migrations here or assume they're already run
});

// Clean up database after all tests
afterAll(async () => {
  // Close the pool
  await testPool.end();
});

// Helper function to clear all tables between tests
export const clearDatabase = async () => {
  await testPool.query('TRUNCATE users, posts, photos, follows, reactions, comments RESTART IDENTITY CASCADE');
};