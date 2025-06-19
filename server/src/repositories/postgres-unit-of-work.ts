// server/src/repositories/postgres-unit-of-work.ts

import { Pool, PoolClient } from 'pg';
import { UnitOfWork } from './interfaces/unit-of-work.interface';
import { PlaidItemRepository } from './interfaces/plaid-item.repository.interface';
import { BackgroundJobRepository } from './interfaces/background-job.repository.interface';
import { PostgresPlaidItemRepository } from './postgres-plaid-item.repository';
import { PostgresBackgroundJobRepository } from './postgres-background-job.repository';
import logger from '../logger';

/**
 * Transaction-scoped repositories that share the same database connection
 */
class TransactionScopedRepositories {
    public readonly plaidItems: PlaidItemRepository;
    public readonly backgroundJobs: BackgroundJobRepository;

    constructor(client: PoolClient) {
        // Create a transaction manager that uses the specific client
        const clientTransactionManager = {
            executeInTransaction: async <T>(operation: (client: PoolClient) => Promise<T>): Promise<T> => {
                // Don't start a new transaction, use the existing client
                return operation(client);
            }
        };

        this.plaidItems = new PostgresPlaidItemRepository(clientTransactionManager);
        this.backgroundJobs = new PostgresBackgroundJobRepository(clientTransactionManager);
    }
}

export class PostgresUnitOfWork implements UnitOfWork {
    private client?: PoolClient;
    private repositories?: TransactionScopedRepositories;
    private isTransactionActive = false;

    constructor(private pool: Pool) { }

    get plaidItems(): PlaidItemRepository {
        if (!this.repositories) {
            throw new Error('No active transaction. Call executeTransaction first.');
        }
        return this.repositories.plaidItems;
    }

    get backgroundJobs(): BackgroundJobRepository {
        if (!this.repositories) {
            throw new Error('No active transaction. Call executeTransaction first.');
        }
        return this.repositories.backgroundJobs;
    }

    async executeTransaction<T>(operation: () => Promise<T>): Promise<T> {
        if (this.isTransactionActive) {
            throw new Error('Transaction already in progress');
        }

        this.client = await this.pool.connect();
        this.repositories = new TransactionScopedRepositories(this.client);
        this.isTransactionActive = true;

        try {
            await this.client.query('BEGIN');
            logger.debug('Transaction started');

            const result = await operation();

            await this.client.query('COMMIT');
            logger.debug('Transaction committed');

            return result;
        } catch (error) {
            await this.rollback();
            throw error;
        } finally {
            this.cleanup();
        }
    }

    async commit(): Promise<void> {
        if (!this.client || !this.isTransactionActive) {
            throw new Error('No active transaction to commit');
        }

        await this.client.query('COMMIT');
        logger.debug('Transaction manually committed');
    }

    async rollback(): Promise<void> {
        if (!this.client) {
            return;
        }

        try {
            await this.client.query('ROLLBACK');
            logger.debug('Transaction rolled back');
        } catch (rollbackError) {
            logger.error('Failed to rollback transaction', { error: rollbackError });
        }
    }

    private cleanup(): void {
        if (this.client) {
            this.client.release();
            this.client = undefined;
        }
        this.repositories = undefined;
        this.isTransactionActive = false;
    }
}
