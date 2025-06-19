// server/src/repositories/plaid.repository.test.ts

import { PoolClient } from 'pg';
import { createPlaidItem, PlaidItemToCreate } from './plaid.repository';

describe('Plaid Repository', () => {
    // Create a more complete mock
    let mockDbClient: Partial<PoolClient>;

    beforeEach(() => {
        mockDbClient = {
            query: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const itemToCreate: PlaidItemToCreate = {
        userId: 'user-123',
        encryptedAccessToken: 'encrypted-token',
        plaidItemId: 'plaid-item-id',
        plaidInstitutionId: 'ins_1',
        institutionName: 'Test Bank',
    };

    it('should execute a transaction correctly on successful creation', async () => {
        // Mock the successful return value of the INSERT query
        const mockCreatedItem = {
            id: 1,
            user_id: itemToCreate.userId,
            plaid_item_id: itemToCreate.plaidItemId,
            plaid_access_token: itemToCreate.encryptedAccessToken,
            plaid_institution_id: itemToCreate.plaidInstitutionId,
            institution_name: itemToCreate.institutionName,
            sync_status: 'good',
            last_successful_sync: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Set up the mock responses in order
        (mockDbClient.query as jest.Mock)
            .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
            .mockResolvedValueOnce({ rows: [mockCreatedItem], rowCount: 1 }) // INSERT
            .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

        const result = await createPlaidItem(mockDbClient as PoolClient, itemToCreate);

        // Check that the function returned the created item
        expect(result).toEqual(mockCreatedItem);

        // Check that the SQL commands were called in the correct order
        const queryCalls = (mockDbClient.query as jest.Mock).mock.calls;
        expect(queryCalls[0][0]).toBe('BEGIN');
        expect(queryCalls[1][0]).toContain('INSERT INTO plaid_items');
        expect(queryCalls[2][0]).toBe('COMMIT');
        expect(mockDbClient.query).toHaveBeenCalledTimes(3);
    });

    it('should execute a ROLLBACK if an error occurs during the transaction', async () => {
        // Simulate a database error on the INSERT query
        const dbError = new Error('Database error');

        (mockDbClient.query as jest.Mock)
            .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN succeeds
            .mockRejectedValueOnce(dbError) // INSERT fails
            .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ROLLBACK

        // Expect the createPlaidItem function to throw the error
        await expect(
            createPlaidItem(mockDbClient as PoolClient, itemToCreate)
        ).rejects.toThrow(dbError);

        // Check that the transaction was started and then rolled back
        const queryCalls = (mockDbClient.query as jest.Mock).mock.calls;
        expect(queryCalls[0][0]).toBe('BEGIN');
        expect(queryCalls[1][0]).toContain('INSERT INTO plaid_items');
        expect(queryCalls[2][0]).toBe('ROLLBACK');
        expect(mockDbClient.query).toHaveBeenCalledTimes(3);
    });
});
