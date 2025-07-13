// server/src/repositories/interfaces/unit-of-work.interface.ts

import { PlaidItemRepository } from './plaid-item.repository.interface';
import { BackgroundJobRepository } from './background-job.repository.interface';

/**
 * Unit of Work pattern interface
 * Coordinates multiple repository operations within a single transaction
 */
export interface UnitOfWork {
    /**
     * Gets the Plaid item repository instance
     */
    plaidItems: PlaidItemRepository;

    /**
     * Gets the background job repository instance
     */
    backgroundJobs: BackgroundJobRepository;

    /**
     * Commits all changes made within this unit of work
     */
    commit(): Promise<void>;

    /**
     * Rolls back all changes made within this unit of work
     */
    rollback(): Promise<void>;

    /**
     * Executes a function within a transaction
     * Automatically commits on success or rolls back on failure
     */
    executeTransaction<T>(operation: () => Promise<T>): Promise<T>;
}
