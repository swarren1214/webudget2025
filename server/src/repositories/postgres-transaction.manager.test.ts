// server/src/repositories/postgres-transaction.manager.test.ts

import { Pool, PoolClient } from 'pg';
import { PostgresTransactionManager } from './postgres-transaction.manager';

describe('PostgresTransactionManager', () => {
    let mockPool: Partial<Pool>;
    let mockClient: Partial<PoolClient>;
    let transactionManager: PostgresTransactionManager;

    beforeEach(() => {
        mockClient = {
            query: jest.fn(),
            release: jest.fn(),
        };

        mockPool = {
            connect: jest.fn().mockResolvedValue(mockClient),
        };

        transactionManager = new PostgresTransactionManager(mockPool as Pool);
    });

    it('should execute operation within transaction successfully', async () => {
        const mockResult = { id: 1, name: 'Test' };
        const operation = jest.fn().mockResolvedValue(mockResult);

        const result = await transactionManager.executeInTransaction(operation);

        expect(result).toEqual(mockResult);
        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.release).toHaveBeenCalled();
        expect(operation).toHaveBeenCalledWith(mockClient);
    });

    it('should rollback transaction on error', async () => {
        const error = new Error('Operation failed');
        const operation = jest.fn().mockRejectedValue(error);

        await expect(
            transactionManager.executeInTransaction(operation)
        ).rejects.toThrow(error);

        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even if rollback fails', async () => {
        const operationError = new Error('Operation failed');
        const rollbackError = new Error('Rollback failed');

        (mockClient.query as jest.Mock)
            .mockResolvedValueOnce(undefined) // BEGIN succeeds
            .mockRejectedValueOnce(rollbackError); // ROLLBACK fails

        const operation = jest.fn().mockRejectedValue(operationError);

        await expect(
            transactionManager.executeInTransaction(operation)
        ).rejects.toThrow(operationError);

        expect(mockClient.release).toHaveBeenCalled();
    });
});