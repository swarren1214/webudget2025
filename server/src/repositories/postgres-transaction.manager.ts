// server/src/repositories/postgres-transaction.manager.ts

import { Pool, PoolClient } from 'pg';
import logger from '../logger';
import { TransactionManager } from './transaction.manager';

export class PostgresTransactionManager implements TransactionManager {
    constructor(private pool: Pool) { }

    async executeInTransaction<T>(
        operation: (client: PoolClient) => Promise<T>
    ): Promise<T> {
        const client = await this.pool.connect();

        try {
            logger.debug('Starting database transaction');
            await client.query('BEGIN');

            const result = await operation(client);

            await client.query('COMMIT');
            logger.debug('Transaction committed successfully');

            return result;
        } catch (error) {
            logger.error('Transaction failed, rolling back', { error });

            // Try to rollback, but don't let rollback errors mask the original error
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                logger.error('Rollback failed', {
                    originalError: error,
                    rollbackError
                });
                // Don't throw the rollback error, continue with the original error
            }

            // Always throw the original error
            throw error;
        } finally {
            // Always release the client back to the pool
            client.release();
        }
    }
}
