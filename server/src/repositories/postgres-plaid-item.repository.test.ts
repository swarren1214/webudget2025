// server/src/repositories/postgres-plaid-item.repository.test.ts

import { PostgresPlaidItemRepository } from './postgres-plaid-item.repository';
import { CreatePlaidItemData } from './interfaces/plaid-item.repository.interface';
import { PoolClient } from 'pg';
import { PlaidItem } from './interfaces';

describe('PostgresPlaidItemRepository', () => {
    let repository: PostgresPlaidItemRepository;
    let mockDbClient: jest.Mocked<PoolClient>;

    beforeEach(() => {
        // Mock the PoolClient, providing only the methods we use (e.g., query)
        mockDbClient = {
            query: jest.fn(),
        } as any;
        // The repository now expects a DbConnection, so we provide our mock client.
        repository = new PostgresPlaidItemRepository(mockDbClient);
    });

    describe('create', () => {
        it('should create a new plaid item by calling the db query method', async () => {
            const itemData: CreatePlaidItemData = {
                userId: 'user-123',
                encryptedAccessToken: 'encrypted-token',
                plaidItemId: 'plaid-item-123',
                plaidInstitutionId: 'ins_1',
                institutionName: 'Test Bank'
            };

            const expectedItem: PlaidItem = {
                id: 1,
                user_id: 'user-123',
                plaid_item_id: 'plaid-item-123',
                plaid_access_token: 'encrypted-token',
                plaid_institution_id: 'ins_1',
                institution_name: 'Test Bank',
                sync_status: 'good',
                last_successful_sync: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            // Mock the direct database query response
            (mockDbClient.query as jest.Mock).mockResolvedValueOnce({ rows: [expectedItem] });

            const result = await repository.create(itemData);

            expect(result).toEqual(expectedItem);
            // Assert that the query method on our mock client was called
            expect(mockDbClient.query).toHaveBeenCalledTimes(1);
        });
    });
    describe('hasReachedItemLimit', () => {
        it('should return true when limit is reached', async () => {
            // Mock the direct database query response
            (mockDbClient.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '10' }] });

            const result = await repository.hasReachedItemLimit('user-123', 10);

            expect(result).toBe(true);
            expect(mockDbClient.query).toHaveBeenCalledTimes(1);
        });

        it('should return false when under limit', async () => {
            // Mock the direct database query response
            (mockDbClient.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '5' }] });

            const result = await repository.hasReachedItemLimit('user-123', 10);

            expect(result).toBe(false);
            expect(mockDbClient.query).toHaveBeenCalledTimes(1);
        });
    });
});
