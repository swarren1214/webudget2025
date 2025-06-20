// server/jest.setup.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Set up TEST-specific environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 chars
process.env.PLAID_CLIENT_ID = 'test-client-id';
process.env.PLAID_SECRET = 'test-secret';
process.env.PLAID_ENV = 'sandbox';

// Dynamically build the database URL for tests from the loaded .env variables
// This ensures the test suite connects with the correct, user-defined credentials.
const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const dbName = process.env.POSTGRES_DB;
process.env.DATABASE_URL = `postgresql://${user}:${password}@db:5432/${dbName}`;