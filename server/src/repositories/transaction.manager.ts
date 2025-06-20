// server/src/repositories/transaction.manager.ts

import { PoolClient } from 'pg';

/**
 * Abstraction for managing database transactions.
 * This interface allows us to decouple transaction management
 * from business logic and data access logic.
 */
export interface TransactionManager {
    /**
     * Executes a database operation within a transaction.
     * Automatically handles BEGIN, COMMIT, and ROLLBACK.
     * 
     * @param operation - A function that performs database operations
     * @returns The result of the operation
     * @throws Any error from the operation (transaction will be rolled back)
     */
    executeInTransaction<T>(
        operation: (client: PoolClient) => Promise<T>
    ): Promise<T>;
}