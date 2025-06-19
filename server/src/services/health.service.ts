// server/src/services/health.service.ts
import { checkConnection } from '../config/database';

export interface HealthStatus {
    status: 'OK' | 'UNAVAILABLE';
    timestamp: string;
    dependencies: {
        database: 'OK' | 'UNAVAILABLE';
    };
}

export const checkHealth = async (): Promise<HealthStatus> => {
    const healthCheck: HealthStatus = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        dependencies: {
            database: 'OK',
        },
    };

    try {
        // The service now depends on our abstraction, not the low-level driver.
        // The intent is clear: "check the connection".
        await checkConnection();
    } catch (error) {
        healthCheck.status = 'UNAVAILABLE';
        healthCheck.dependencies.database = 'UNAVAILABLE';
    }

    return healthCheck;
};
