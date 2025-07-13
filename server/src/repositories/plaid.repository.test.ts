// server/src/repositories/plaid.repository.test.ts

import { PoolClient } from 'pg';
import { createPlaidItem, PlaidItemToCreate } from './plaid.repository';

describe('Plaid Repository', () => {
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

    it('should create a plaid item successfully', async () => {
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

        (mockDbClient.query as jest.Mock).mockResolvedValueOnce({
            rows: [mockCreatedItem],
            rowCount: 1
        });

        const result = await createPlaidItem(mockDbClient as PoolClient, itemToCreate);

        // Check that the function returned the created item
        expect(result).toEqual(mockCreatedItem);

        // Check that the INSERT query was called with correct parameters
        expect(mockDbClient.query).toHaveBeenCalledTimes(1);
        expect(mockDbClient.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO plaid_items'),
            [
                itemToCreate.userId,
                itemToCreate.encryptedAccessToken,
                itemToCreate.plaidItemId,
                itemToCreate.plaidInstitutionId,
                itemToCreate.institutionName,
            ]
        );
    });

    it('should throw an error if the database query fails', async () => {
        // Simulate a database error
        const dbError = new Error('Database error');
        (mockDbClient.query as jest.Mock).mockRejectedValueOnce(dbError);

        // Expect the createPlaidItem function to throw the error
        await expect(
            createPlaidItem(mockDbClient as PoolClient, itemToCreate)
        ).rejects.toThrow(dbError);

        expect(mockDbClient.query).toHaveBeenCalledTimes(1);
    });
});
