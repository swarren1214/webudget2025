// server/src/repositories/postgres-unit-of-work.ts

import { Pool, PoolClient } from 'pg';
import { UnitOfWork } from './interfaces/unit-of-work.interface';
import { PlaidItemRepository } from './interfaces/plaid-item.repository.interface';
import { BackgroundJobRepository } from './interfaces/background-job.repository.interface';
import { PostgresPlaidItemRepository } from './postgres-plaid-item.repository';
import { PostgresBackgroundJobRepository } from './postgres-background-job.repository';
import logger from '../logger';

export class PostgresUnitOfWork implements UnitOfWork {
    public plaidItems!: PlaidItemRepository;
    public backgroundJobs!: BackgroundJobRepository;

    private client?: PoolClient;
    private isTransactionActive = false;

    constructor(private pool: Pool) { }

    async executeTransaction<T>(operation: () => Promise<T>): Promise<T> {
        if (this.isTransactionActive) {
            throw new Error('Transaction already in progress');
        }

        this.client = await this.pool.connect();
        // Instantiate repositories with the single transactional client
        this.plaidItems = new PostgresPlaidItemRepository(this.client);
        this.backgroundJobs = new PostgresBackgroundJobRepository(this.client);
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

    // Note: commit and rollback are now primarily for internal use by executeTransaction,
    // but are kept to satisfy the interface if manual transaction control were ever needed.
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
        // Clear repository instances
        this.plaidItems = undefined as any;
        this.backgroundJobs = undefined as any;
        this.isTransactionActive = false;
    }
}