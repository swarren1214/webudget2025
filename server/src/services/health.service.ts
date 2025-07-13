// server/src/services/health.service.ts
export type CheckDbConnectionFn = () => Promise<void>;

export interface HealthStatus {
    status: 'OK' | 'UNAVAILABLE';
    timestamp: string;
    dependencies: {
        database: 'OK' | 'UNAVAILABLE';
    };
}

export const checkHealth = async (
    checkDbConnection: CheckDbConnectionFn
): Promise<HealthStatus> => {
    const healthCheck: HealthStatus = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        dependencies: {
            database: 'OK',
        },
    };

    try {
        // 3. Call the injected function.
        await checkDbConnection();
    } catch (error) {
        healthCheck.status = 'UNAVAILABLE';
        healthCheck.dependencies.database = 'UNAVAILABLE';
    }

    return healthCheck;
};
