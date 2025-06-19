// server/src/services/health.service.ts
import pool from '../config/database';

/**
 * Defines the structure of the health status response.
 */
export interface HealthStatus {
    status: 'OK' | 'UNAVAILABLE';
    timestamp: string;
    dependencies: {
        database: 'OK' | 'UNAVAILABLE';
    };
}

/**
 * Checks the health of the application and its dependencies.
 * @returns {Promise<HealthStatus>} A promise that resolves to the health status object.
 */
export const checkHealth = async (): Promise<HealthStatus> => {
    const healthCheck: HealthStatus = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        dependencies: {
            database: 'OK',
        },
    };

    try {
        // The only responsibility of this service is to check the database.
        await pool.query('SELECT 1');
    } catch (error) {
        healthCheck.status = 'UNAVAILABLE';
        healthCheck.dependencies.database = 'UNAVAILABLE';
        // Note: We do not log the error here. Logging is a concern
        // for the layer that handles the user request (the controller).
    }

    return healthCheck;
};
