// server/src/repositories/plaid.repository.test.ts

import { PoolClient } from 'pg';
import { createPlaidItem, PlaidItemToCreate } from './plaid.repository';

// Mock the 'pg' PoolClient
const mockDbClient = {
    query: jest.fn(),
};

// Clear all mock history before each test
beforeEach(() => {
    (mockDbClient.query as jest.Mock).mockClear();
});

describe('Plaid Repository', () => {

    const itemToCreate: PlaidItemToCreate = {
        userId: 'user-123',
        encryptedAccessToken: 'encrypted-token',
        plaidItemId: 'plaid-item-id',
        plaidInstitutionId: 'ins_1',
        institutionName: 'Test Bank',
    };

    it('should execute a transaction correctly on successful creation', async () => {
        // --- ARRANGE ---
        // Mock the successful return value of the INSERT query
        const mockCreatedItem = { id: 1, ...itemToCreate };
        (mockDbClient.query as jest.Mock).mockResolvedValueOnce({ rows: [mockCreatedItem] });

        // --- ACT ---
        const result = await createPlaidItem(mockDbClient as unknown as PoolClient, itemToCreate);

        // --- ASSERT ---
        // 1. Check that the function returned the created item
        expect(result).toEqual(mockCreatedItem);

        // 2. Check that the SQL commands were called in the correct order
        const queryCalls = (mockDbClient.query as jest.Mock).mock.calls;
        expect(queryCalls[0][0]).toBe('BEGIN');
        expect(queryCalls[1][0]).toContain('INSERT INTO plaid_items');
        // Note: We are not testing the background_jobs insert yet, as it's commented out.
        expect(queryCalls[2][0]).toBe('COMMIT');
        expect(mockDbClient.query).toHaveBeenCalledTimes(3);
    });

    it('should execute a ROLLBACK if an error occurs during the transaction', async () => {
        // --- ARRANGE ---
        // Simulate a database error on the INSERT query
        const dbError = new Error('Database error');
        (mockDbClient.query as jest.Mock).mockRejectedValueOnce(dbError);

        // --- ACT & ASSERT ---
        // Expect the createPlaidItem function to throw the error
        await expect(
            createPlaidItem(mockDbClient as unknown as PoolClient, itemToCreate)
        ).rejects.toThrow(dbError);

        // Check that the transaction was started and then rolled back
        const queryCalls = (mockDbClient.query as jest.Mock).mock.calls;
        expect(queryCalls[0][0]).toBe('BEGIN');
        expect(queryCalls[1][0]).toBe('ROLLBACK');
        expect(mockDbClient.query).toHaveBeenCalledTimes(2);
    });
});