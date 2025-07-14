// server/src/config/env.test.ts
import { ConfigurationError } from '../utils/errors';

describe('Environment Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset modules to clear any cached config
        jest.resetModules();
        // Reset process.env
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    it('should throw ConfigurationError for missing required environment variables', () => {
        // Remove required environment variables
        delete process.env.DATABASE_URL;
        delete process.env.JWT_SECRET;
        delete process.env.ENCRYPTION_KEY;

        // Expect ConfigurationError to be thrown when importing config
        expect(() => {
            require('./env');
        }).toThrow('Invalid environment variables found');
    });

    it('should throw ConfigurationError with detailed message for invalid DATABASE_URL', () => {
        // Set invalid DATABASE_URL
        process.env.DATABASE_URL = 'invalid-url';
        process.env.JWT_SECRET = 'test-secret';
        process.env.ENCRYPTION_KEY = '1234567890123456789012345678901234567890123456789012345678901234';
        process.env.PLAID_CLIENT_ID = 'test-client-id';
        process.env.PLAID_SECRET = 'test-secret';
        process.env.PLAID_ENV = 'sandbox';
        process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret';

        expect(() => {
            require('./env');
        }).toThrow('Invalid environment variables found');
    });

    it('should successfully validate correct environment variables', () => {
        // Set valid environment variables
        process.env.NODE_ENV = 'test';
        process.env.PORT = '3000';
        process.env.LOG_LEVEL = 'info';
        process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/testdb';
        process.env.JWT_SECRET = 'test-secret';
        process.env.ENCRYPTION_KEY = '1234567890123456789012345678901234567890123456789012345678901234';
        process.env.PLAID_CLIENT_ID = 'test-client-id';
        process.env.PLAID_SECRET = 'test-secret';
        process.env.PLAID_ENV = 'sandbox';
        process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret';

        // Should not throw
        expect(() => {
            const config = require('./env');
            expect(config.default).toBeDefined();
            expect(config.default.NODE_ENV).toBe('test');
            expect(config.default.PORT).toBe(3000);
        }).not.toThrow();
    });
}); 