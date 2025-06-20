// server/src/services/health.service.test.ts

import { checkHealth, CheckDbConnectionFn } from './health.service';

describe('Health Service', () => {
    const dbOk: CheckDbConnectionFn = jest.fn().mockResolvedValue(undefined);
    const dbFail: CheckDbConnectionFn = jest.fn().mockRejectedValue(new Error('DB is down'));

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a status of OK when dependencies are healthy', async () => {
        // --- ARRANGE & ACT ---
        const healthStatus = await checkHealth(dbOk);

        // --- ASSERT ---
        expect(healthStatus.status).toBe('OK');
        expect(dbOk).toHaveBeenCalledTimes(1);
    });

    it('should return a status of UNAVAILABLE when database connection fails', async () => {
        // --- ARRANGE & ACT ---
        const healthStatus = await checkHealth(dbFail);

        // --- ASSERT ---
        expect(healthStatus.status).toBe('UNAVAILABLE');
        expect(dbFail).toHaveBeenCalledTimes(1);
    });
});
