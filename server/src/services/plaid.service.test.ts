// server/src/services/plaid.service.test.ts

import { CountryCode, Products, LinkTokenCreateResponse, ItemStatus } from 'plaid';
import {
    createLinkToken,
    PlaidLinkTokenCreateFn,
    exchangePublicToken,
    EncryptFn,
    PlaidExchangeTokenFn,
    PlaidGetInstitutionFn,
    PlaidItemGetFn
} from './plaid.service';
import { createPlaidItem, PlaidItem } from '../repositories/plaid.repository';
import { Pool, PoolClient } from 'pg';
import { TransactionManager } from '../repositories/transaction.manager';

describe('Plaid Service', () => {

    // --- Mock Dependencies ---

    // 1. Mock for a successful Plaid API call.
    const mockPlaidSuccessResponse: LinkTokenCreateResponse = {
        link_token: 'link-sandbox-12345',
        expiration: new Date().toISOString(),
        request_id: 'req_abcde',
    };
    const mockPlaidClientSuccess: PlaidLinkTokenCreateFn = jest.fn()
        .mockResolvedValue(mockPlaidSuccessResponse);

    // 2. Mock for a failed Plaid API call.
    const mockPlaidError = new Error('Plaid API is down');
    const mockPlaidClientFailure: PlaidLinkTokenCreateFn = jest.fn()
        .mockRejectedValue(mockPlaidError);

    // This ensures that our mocks are clean before each test runs.
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createLinkToken', () => {
        it('should return link token data on successful Plaid API call', async () => {
            const userId = 'user-123';

            const result = await createLinkToken(userId, mockPlaidClientSuccess);

            expect(result).toEqual({
                linkToken: mockPlaidSuccessResponse.link_token,
                expiration: mockPlaidSuccessResponse.expiration,
            });

            expect(mockPlaidClientSuccess).toHaveBeenCalledTimes(1);
            expect(mockPlaidClientSuccess).toHaveBeenCalledWith({
                user: { client_user_id: userId },
                client_name: 'WeBudget',
                products: [Products.Transactions],
                language: 'en',
                country_codes: [CountryCode.Us],
            });
        });

        it('should throw an error if the Plaid API call fails', async () => {
            // --- ARRANGE ---
            const userId = 'user-123';

            // --- ACT & ASSERT ---
            // We expect the promise to be rejected and to throw the specific error
            // that our mock is configured to throw.
            await expect(
                createLinkToken(userId, mockPlaidClientFailure)
            ).rejects.toThrow(mockPlaidError);

            // We should also check that our failing mock was still called correctly.
            expect(mockPlaidClientFailure).toHaveBeenCalledTimes(1);
        });
    });

    describe('exchangePublicToken', () => {
        // --- Mock Dependencies ---
        const mockPlaidExchangeResponse = {
            access_token: 'real-access-token',
            item_id: 'plaid-item-id-xyz'
        };
        const mockItemGetResponse = {
            item: {
                institution_id: 'ins_1'
            }
        };
        const mockPlaidInstitutionResponse = {
            institution: {
                name: 'Test Bank'
            }
        };

        // Add this line - it was missing!
        const mockEncryptedToken = 'encrypted-token-string';

        // This is the fully defined mock object
        const mockNewPlaidItem: PlaidItem = {
            id: 1,
            user_id: 'user-123',
            plaid_item_id: 'plaid-item-id-xyz',
            plaid_access_token: 'encrypted-token-string',
            plaid_institution_id: 'ins_1',
            institution_name: 'Test Bank',
            sync_status: 'good' as ItemStatus,
            last_successful_sync: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const mockPlaidExchange: PlaidExchangeTokenFn = jest.fn().mockResolvedValue(mockPlaidExchangeResponse);
        const mockPlaidItemGet: PlaidItemGetFn = jest.fn().mockResolvedValue(mockItemGetResponse);
        const mockPlaidGetInstitution: PlaidGetInstitutionFn = jest.fn().mockResolvedValue(mockPlaidInstitutionResponse);
        const mockEncrypt: EncryptFn = jest.fn().mockReturnValue(mockEncryptedToken);
        const mockCreatePlaidItem: jest.MockedFunction<typeof createPlaidItem> = jest.fn().mockResolvedValue(mockNewPlaidItem);

        const mockDbClient = { release: jest.fn() };
        const mockDbPool = { connect: jest.fn().mockResolvedValue(mockDbClient) } as unknown as Pool;

        const mockTransactionManager: TransactionManager = {
            executeInTransaction: jest.fn().mockImplementation(
                async (operation: (client: PoolClient) => Promise<any>) => {
                    // Simulate providing a client to the operation
                    const mockClient = {} as PoolClient;
                    return operation(mockClient);
                }
            )
        };

        beforeEach(() => jest.clearAllMocks());

        it('should correctly orchestrate token exchange, encryption, and item creation', async () => {
            // Set up the mock to return the expected item
            (mockTransactionManager.executeInTransaction as jest.Mock).mockImplementation(
                async (operation) => {
                    const mockClient = {} as PoolClient;
                    // Mock createPlaidItem being called within the transaction
                    jest.spyOn(require('../repositories/plaid.repository'), 'createPlaidItem')
                        .mockResolvedValue(mockNewPlaidItem);
                    return operation(mockClient);
                }
            );

            const result = await exchangePublicToken(
                mockTransactionManager,
                mockPlaidExchange,
                mockPlaidItemGet,
                mockPlaidGetInstitution,
                mockEncrypt,
                'user-123',
                'public-token'
            );

            expect(result).toEqual(mockNewPlaidItem);
            expect(mockTransactionManager.executeInTransaction).toHaveBeenCalledTimes(1);
        });

        it('should not call transaction manager if Plaid exchange fails', async () => {
            const error = new Error('Plaid exchange failed');
            (mockPlaidExchange as jest.Mock).mockRejectedValueOnce(error);

            await expect(
                exchangePublicToken(
                    mockTransactionManager,
                    mockPlaidExchange,
                    mockPlaidItemGet,
                    mockPlaidGetInstitution,
                    mockEncrypt,
                    'user-123',
                    'public-token'
                )
            ).rejects.toThrow(error);

            // Transaction should never be started
            expect(mockTransactionManager.executeInTransaction).not.toHaveBeenCalled();
        });
    });
});
