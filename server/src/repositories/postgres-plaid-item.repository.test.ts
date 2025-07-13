// server/src/repositories/postgres-plaid-item.repository.test.ts

import { PostgresPlaidItemRepository } from './postgres-plaid-item.repository';
import { TransactionManager } from './transaction.manager';
import { CreatePlaidItemData } from './interfaces/plaid-item.repository.interface';

describe('PostgresPlaidItemRepository', () => {
    let repository: PostgresPlaidItemRepository;
    let mockTransactionManager: jest.Mocked<TransactionManager>;

    beforeEach(() => {
        mockTransactionManager = {
            executeInTransaction: jest.fn()
        };
        repository = new PostgresPlaidItemRepository(mockTransactionManager);
    });

    describe('create', () => {
        it('should create a new plaid item', async () => {
            const itemData: CreatePlaidItemData = {
                userId: 'user-123',
                encryptedAccessToken: 'encrypted-token',
                plaidItemId: 'plaid-item-123',
                plaidInstitutionId: 'ins_1',
                institutionName: 'Test Bank'
            };

            const expectedItem = {
                id: 1,
                user_id: 'user-123',
                plaid_access_token: 'encrypted-token',
                // ... other fields
            };

            mockTransactionManager.executeInTransaction.mockImplementation(async (operation) => {
                const mockClient = {
                    query: jest.fn().mockResolvedValue({ rows: [expectedItem] })
                };
                return operation(mockClient as any);
            });

            const result = await repository.create(itemData);

            expect(result).toEqual(expectedItem);
            expect(mockTransactionManager.executeInTransaction).toHaveBeenCalled();
        });
    });

    describe('hasReachedItemLimit', () => {
        it('should return true when limit is reached', async () => {
            mockTransactionManager.executeInTransaction.mockImplementation(async (operation) => {
                const mockClient = {
                    query: jest.fn().mockResolvedValue({ rows: [{ count: '10' }] })
                };
                return operation(mockClient as any);
            });

            const result = await repository.hasReachedItemLimit('user-123', 10);

            expect(result).toBe(true);
        });

        it('should return false when under limit', async () => {
            mockTransactionManager.executeInTransaction.mockImplementation(async (operation) => {
                const mockClient = {
                    query: jest.fn().mockResolvedValue({ rows: [{ count: '5' }] })
                };
                return operation(mockClient as any);
            });

            const result = await repository.hasReachedItemLimit('user-123', 10);

            expect(result).toBe(false);
        });
    });
});
