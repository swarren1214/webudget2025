// server/src/services/health.service.test.ts

// 1. Import the function we want to test
import { checkHealth } from './health.service';
// 2. Import the dependency that our service uses, which we need to mock
import { checkConnection } from '../config/database';

// 3. Tell Jest to mock the entire database module.
// This replaces the actual `checkConnection` function with a mock
// that we can control in our tests.
jest.mock('../config/database');

// We cast the imported checkConnection to a Jest Mock type for type-safety
const mockedCheckConnection = checkConnection as jest.Mock;

// `describe` creates a test suite, a container for related tests.
describe('Health Service', () => {

    // Test case 1: The "Happy Path"
    it('should return a status of OK when dependencies are healthy', async () => {
        // --- ARRANGE ---
        // We configure our mock to simulate a successful database connection.
        // `mockResolvedValue` means the function will successfully return a Promise.
        mockedCheckConnection.mockResolvedValue(undefined);

        // --- ACT ---
        // We call the function we are testing.
        const healthStatus = await checkHealth();

        // --- ASSERT ---
        // We make assertions about the result.
        expect(healthStatus.status).toBe('OK');
        expect(healthStatus.dependencies.database).toBe('OK');
        // We can also assert that our mock was actually called.
        expect(mockedCheckConnection).toHaveBeenCalledTimes(1);
    });

    // Test case 2: The "Failure Path"
    it('should return a status of UNAVAILABLE when database connection fails', async () => {
        // --- ARRANGE ---
        // We configure our mock to simulate a database error.
        // `mockRejectedValue` means the function will throw an error.
        const dbError = new Error('Database connection failed');
        mockedCheckConnection.mockRejectedValue(dbError);

        // --- ACT ---
        const healthStatus = await checkHealth();

        // --- ASSERT ---
        expect(healthStatus.status).toBe('UNAVAILABLE');
        expect(healthStatus.dependencies.database).toBe('UNAVAILABLE');
        expect(mockedCheckConnection).toHaveBeenCalledTimes(1);
    });
});
