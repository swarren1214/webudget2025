// Set up environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 chars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PLAID_CLIENT_ID = 'test-client-id';
process.env.PLAID_SECRET = 'test-secret';
process.env.PLAID_ENV = 'sandbox';