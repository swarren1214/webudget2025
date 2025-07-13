// server/src/services/plaid.service.test.ts

import { CountryCode, Products } from 'plaid';
import {
    createLinkToken,
    PlaidLinkTokenCreateFn,
    exchangePublicToken,
    exchangePublicTokenLegacy,
    PlaidTokenExchangeContext,
    ExchangeTokenRequest,
    EncryptFn,
    PlaidExchangeTokenFn,
    PlaidGetInstitutionFn,
    PlaidItemGetFn,
    canLinkAnotherAccount,
    archiveInstitution
} from './plaid.service';
import { PlaidItemRepository, UnitOfWork, PlaidItem, ItemStatus } from '../repositories/interfaces';
import { ApiError, ValidationError, ConflictError } from '../utils/errors';

describe('Plaid Service', () => {
    // Mock dependencies
    const mockPlaidSuccessResponse = {
        link_token: 'link-sandbox-12345',
        expiration: new Date().toISOString(),
        request_id: 'req_abcde',
    };
    const mockPlaidClientSuccess: PlaidLinkTokenCreateFn = jest.fn()
        .mockResolvedValue(mockPlaidSuccessResponse);

    const mockPlaidError = new Error('Plaid API is down');
    const mockPlaidClientFailure: PlaidLinkTokenCreateFn = jest.fn()
        .mockRejectedValue(mockPlaidError);

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
            const userId = 'user-123';

            await expect(
                createLinkToken(userId, mockPlaidClientFailure)
            ).rejects.toThrow(mockPlaidError);

            expect(mockPlaidClientFailure).toHaveBeenCalledTimes(1);
        });
    });

    describe('exchangePublicToken', () => {
        // --- ARRANGE ---
        // 1. Define mock responses from Plaid and a mock encrypted token.
        const mockPlaidExchangeResponse = { access_token: 'real-access-token', item_id: 'plaid-item-id-xyz' };
        const mockItemGetResponse = { item: { institution_id: 'ins_1' } };
        const mockPlaidInstitutionResponse = { institution: { name: 'Test Bank' } };
        const mockEncryptedToken = 'encrypted-token-string';

        // 2. Define mock implementations of the service's function-based dependencies.
        const mockPlaidExchangeToken: PlaidExchangeTokenFn = jest.fn().mockResolvedValue(mockPlaidExchangeResponse);
        const mockPlaidItemGet: PlaidItemGetFn = jest.fn().mockResolvedValue(mockItemGetResponse);
        const mockPlaidGetInstitution: PlaidGetInstitutionFn = jest.fn().mockResolvedValue(mockPlaidInstitutionResponse);
        const mockEncrypt: EncryptFn = jest.fn().mockReturnValue(mockEncryptedToken);

        // 3. Create a mock UnitOfWork object that conforms to the interface.
        // This allows us to test the service's interaction with its repositories.
        const mockUnitOfWork: jest.Mocked<UnitOfWork> = {
            plaidItems: {
                create: jest.fn(),
                findById: jest.fn(),
                findByUserId: jest.fn(),
                findByPlaidItemId: jest.fn(),
                update: jest.fn(),
                archive: jest.fn(),
                hasReachedItemLimit: jest.fn(),
            },
            backgroundJobs: {
                create: jest.fn(),
                findNextAvailable: jest.fn(),
                markAsRunning: jest.fn(),
                markAsCompleted: jest.fn(),
                markAsFailed: jest.fn(),
            },
            // Mock executeTransaction to simply run the operation passed to it.
            // This lets us test the logic that happens *inside* the transaction.
            executeTransaction: jest.fn().mockImplementation(operation => operation()),
            commit: jest.fn(),
            rollback: jest.fn(),
        };

        beforeEach(() => jest.clearAllMocks());

        // Helper function to create context and request objects for the new signature
        const createExchangeTokenParams = (userId: string, publicToken: string) => {
            const context: PlaidTokenExchangeContext = {
                plaidExchangeToken: mockPlaidExchangeToken,
                plaidItemGet: mockPlaidItemGet,
                plaidGetInstitution: mockPlaidGetInstitution,
                encrypt: mockEncrypt,
                unitOfWork: mockUnitOfWork,
            };
            
            const request: ExchangeTokenRequest = {
                userId,
                publicToken,
            };
            
            return { context, request };
        };

        // Temporarily use legacy function calls for other tests
        const testExchangeFunction = exchangePublicTokenLegacy;

        it('should correctly orchestrate token exchange and atomic item creation', async () => {
            // Arrange: Set up the return value for the repository call.
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
                archived_at: null,
            };
            (mockUnitOfWork.plaidItems.create as jest.Mock).mockResolvedValue(mockNewPlaidItem);

            // --- ACT ---
            // Call the service with all its dependencies injected, including our mock UoW.
            const { context, request } = createExchangeTokenParams('user-123', 'public-token-abc');
            const result = await testExchangeFunction(
                mockPlaidExchangeToken,
                mockPlaidItemGet,
                mockPlaidGetInstitution,
                mockEncrypt,
                mockUnitOfWork,
                'user-123',
                'public-token-abc'
            );

            // --- ASSERT ---
            // 1. Assert that the final result is the new item created by the repository.
            expect(result).toEqual(mockNewPlaidItem);

            // 2. Assert that the transaction mechanism was used.
            expect(mockUnitOfWork.executeTransaction).toHaveBeenCalledTimes(1);

            // 3. Assert that the PlaidItem was created with the correct, encrypted data.
            expect(mockUnitOfWork.plaidItems.create).toHaveBeenCalledWith({
                userId: 'user-123',
                encryptedAccessToken: mockEncryptedToken,
                plaidItemId: 'plaid-item-id-xyz',
                plaidInstitutionId: 'ins_1',
                institutionName: 'Test Bank',
            });

            // 4. Assert that the background sync job was created within the same transaction.
            expect(mockUnitOfWork.backgroundJobs.create).toHaveBeenCalledWith({
                jobType: 'INITIAL_SYNC',
                payload: { itemId: mockNewPlaidItem.id, userId: 'user-123' },
            });
        });

        it('should throw an error without calling repositories if Plaid exchange fails', async () => {
            // Arrange: Mock a failure from the Plaid client.
            const plaidError = new Error('Plaid exchange failed');
            (mockPlaidExchangeToken as jest.Mock).mockRejectedValueOnce(plaidError);

            // --- ACT & ASSERT ---
            // Expect the service to throw the same error it received from its dependency.
            const { context, request } = createExchangeTokenParams('user-123', 'public-token');
            await expect(
                testExchangeFunction(context, request)
            ).rejects.toThrow(plaidError);

            // Assert that no transaction was even attempted.
            expect(mockUnitOfWork.executeTransaction).not.toHaveBeenCalled();
        });

        describe('Input Validation', () => {
            it('should throw ValidationError for empty userId', async () => {
                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        '', // empty userId
                        'public-test-token-123456789'
                    )
                ).rejects.toThrow(ValidationError);
            });

            it('should throw ValidationError for null userId', async () => {
                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        null as any, // null userId
                        'public-test-token-123456789'
                    )
                ).rejects.toThrow(ValidationError);
            });

            it('should throw ValidationError for non-string userId', async () => {
                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        123 as any, // number instead of string
                        'public-test-token-123456789'
                    )
                ).rejects.toThrow(ValidationError);
            });

            it('should throw ValidationError for invalid userId format', async () => {
                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        'invalid-user-id', // invalid format
                        'public-test-token-123456789'
                    )
                ).rejects.toThrow(ValidationError);
            });

                         it('should accept valid UUID userId format', async () => {
                 const validUuid = '550e8400-e29b-41d4-a716-446655440000';
                 
                 // Setup successful flow
                 (mockPlaidExchangeToken as jest.Mock).mockResolvedValue({
                     access_token: 'access-token-xyz',
                     item_id: 'item-id-123',
                 });
                 (mockPlaidItemGet as jest.Mock).mockResolvedValue({
                     item: { institution_id: 'ins_123' },
                 });
                 (mockPlaidGetInstitution as jest.Mock).mockResolvedValue({
                     institution: { name: 'Test Bank' },
                 });
                 (mockEncrypt as jest.Mock).mockReturnValue('encrypted-token');
                 (mockUnitOfWork.executeTransaction as jest.Mock).mockImplementation(async (fn) => fn());
                 (mockUnitOfWork.plaidItems.create as jest.Mock).mockResolvedValue({
                     id: 1,
                     userId: validUuid,
                     plaidItemId: 'item-id-123',
                     plaidInstitutionId: 'ins_123',
                     institutionName: 'Test Bank',
                     encryptedAccessToken: 'encrypted-token',
                     syncStatus: 'good',
                     createdAt: new Date(),
                     updatedAt: new Date(),
                 });
                 (mockUnitOfWork.backgroundJobs.create as jest.Mock).mockResolvedValue(undefined);

                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        validUuid,
                        'public-test-token-123456789'
                    )
                ).resolves.toBeDefined();
            });

                         it('should accept valid Auth0 ID userId format', async () => {
                 const validAuth0Id = 'auth0|507f1f77bcf86cd799439011';
                 
                 // Setup successful flow
                 (mockPlaidExchangeToken as jest.Mock).mockResolvedValue({
                     access_token: 'access-token-xyz',
                     item_id: 'item-id-123',
                 });
                 (mockPlaidItemGet as jest.Mock).mockResolvedValue({
                     item: { institution_id: 'ins_123' },
                 });
                 (mockPlaidGetInstitution as jest.Mock).mockResolvedValue({
                     institution: { name: 'Test Bank' },
                 });
                 (mockEncrypt as jest.Mock).mockReturnValue('encrypted-token');
                 (mockUnitOfWork.executeTransaction as jest.Mock).mockImplementation(async (fn) => fn());
                 (mockUnitOfWork.plaidItems.create as jest.Mock).mockResolvedValue({
                     id: 1,
                     userId: validAuth0Id,
                     plaidItemId: 'item-id-123',
                     plaidInstitutionId: 'ins_123',
                     institutionName: 'Test Bank',
                     encryptedAccessToken: 'encrypted-token',
                     syncStatus: 'good',
                     createdAt: new Date(),
                     updatedAt: new Date(),
                 });
                 (mockUnitOfWork.backgroundJobs.create as jest.Mock).mockResolvedValue(undefined);

                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        validAuth0Id,
                        'public-test-token-123456789'
                    )
                ).resolves.toBeDefined();
            });

            it('should throw ValidationError for empty publicToken', async () => {
                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        '550e8400-e29b-41d4-a716-446655440000',
                        '' // empty publicToken
                    )
                ).rejects.toThrow(ValidationError);
            });

            it('should throw ValidationError for invalid publicToken format', async () => {
                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        '550e8400-e29b-41d4-a716-446655440000',
                        'invalid-token' // invalid format
                    )
                ).rejects.toThrow(ValidationError);
            });

            it('should throw ValidationError for short publicToken', async () => {
                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        '550e8400-e29b-41d4-a716-446655440000',
                        'public-short' // too short
                    )
                ).rejects.toThrow(ValidationError);
            });
        });

                 describe('Idempotency Protection', () => {
             it('should throw ConflictError when plaid_item_id already exists', async () => {
                 const dbError = {
                     code: '23505',
                     constraint: 'plaid_items_plaid_item_id_key',
                     message: 'duplicate key value violates unique constraint'
                 };

                 (mockPlaidExchangeToken as jest.Mock).mockResolvedValue({
                     access_token: 'access-token-xyz',
                     item_id: 'duplicate-item-id-123',
                 });
                 (mockPlaidItemGet as jest.Mock).mockResolvedValue({
                     item: { institution_id: 'ins_123' },
                 });
                 (mockPlaidGetInstitution as jest.Mock).mockResolvedValue({
                     institution: { name: 'Test Bank' },
                 });
                 (mockEncrypt as jest.Mock).mockReturnValue('encrypted-token');
                 
                 // Mock the transaction to throw a database constraint error
                 (mockUnitOfWork.executeTransaction as jest.Mock).mockImplementation(async (fn) => fn());
                 (mockUnitOfWork.plaidItems.create as jest.Mock).mockRejectedValue(dbError);

                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        '550e8400-e29b-41d4-a716-446655440000',
                        'public-test-token-123456789'
                    )
                ).rejects.toThrow(ConflictError);
            });

            it('should re-throw non-constraint database errors', async () => {
                const dbError = new Error('Connection timeout');

                mockPlaidExchangeToken.mockResolvedValue({
                    access_token: 'access-token-xyz',
                    item_id: 'item-id-123',
                });
                mockPlaidItemGet.mockResolvedValue({
                    item: { institution_id: 'ins_123' },
                });
                mockPlaidGetInstitution.mockResolvedValue({
                    institution: { name: 'Test Bank' },
                });
                mockEncrypt.mockReturnValue('encrypted-token');
                
                // Mock the transaction to throw a non-constraint error
                mockUnitOfWork.executeTransaction.mockImplementation(async (fn) => fn());
                mockUnitOfWork.plaidItems.create.mockRejectedValue(dbError);

                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        '550e8400-e29b-41d4-a716-446655440000',
                        'public-test-token-123456789'
                    )
                ).rejects.toThrow('Connection timeout');
            });
        });

        describe('Plaid API Error Handling', () => {
            it('should throw ValidationError for INVALID_PUBLIC_TOKEN', async () => {
                const plaidError = {
                    error_code: 'INVALID_PUBLIC_TOKEN',
                    message: 'The public token is invalid'
                };

                mockPlaidExchangeToken.mockRejectedValue(plaidError);

                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        '550e8400-e29b-41d4-a716-446655440000',
                        'public-test-token-123456789'
                    )
                ).rejects.toThrow(ValidationError);
            });

            it('should throw ApiError for PUBLIC_TOKEN_EXCHANGE_FAILED', async () => {
                const plaidError = {
                    error_code: 'PUBLIC_TOKEN_EXCHANGE_FAILED',
                    message: 'Token exchange failed'
                };

                mockPlaidExchangeToken.mockRejectedValue(plaidError);

                await expect(
                    testExchangeFunction(
                        mockPlaidExchangeToken,
                        mockPlaidItemGet,
                        mockPlaidGetInstitution,
                        mockEncrypt,
                        mockUnitOfWork,
                        '550e8400-e29b-41d4-a716-446655440000',
                        'public-test-token-123456789'
                    )
                ).rejects.toThrow('Failed to exchange public token with Plaid');
            });
        });
    });

    describe('canLinkAnotherAccount', () => {
        const mockRepository: jest.Mocked<PlaidItemRepository> = {
            create: jest.fn(),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            findByPlaidItemId: jest.fn(),
            update: jest.fn(),
            archive: jest.fn(),
            hasReachedItemLimit: jest.fn(),
        };

        it('should return true when user has not reached limit', async () => {
            mockRepository.hasReachedItemLimit.mockResolvedValue(false);

            const result = await canLinkAnotherAccount('user-123', mockRepository, 5);

            expect(result).toBe(true);
            expect(mockRepository.hasReachedItemLimit).toHaveBeenCalledWith('user-123', 5);
        });

        it('should return false when user has reached limit', async () => {
            mockRepository.hasReachedItemLimit.mockResolvedValue(true);

            const result = await canLinkAnotherAccount('user-123', mockRepository, 5);

            expect(result).toBe(false);
        });
    });

    describe('archiveInstitution', () => {
        const mockRepository: jest.Mocked<PlaidItemRepository> = {
            create: jest.fn(),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            findByPlaidItemId: jest.fn(),
            update: jest.fn(),
            archive: jest.fn(),
            hasReachedItemLimit: jest.fn(),
        };

        it('should archive institution when user owns it', async () => {
            const mockInstitution: PlaidItem = {
                id: 1,
                user_id: 'user-123',
                plaid_item_id: 'item-123',
                plaid_access_token: 'encrypted',
                plaid_institution_id: 'ins_1',
                institution_name: 'Test Bank',
                sync_status: 'good' as ItemStatus,
                last_successful_sync: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                archived_at: null,
            };

            mockRepository.findById.mockResolvedValue(mockInstitution);
            mockRepository.archive.mockResolvedValue(undefined);

            await archiveInstitution('user-123', 1, mockRepository);

            expect(mockRepository.findById).toHaveBeenCalledWith(1);
            expect(mockRepository.archive).toHaveBeenCalledWith(1);
        });

        it('should throw 404 when institution not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(
                archiveInstitution('user-123', 999, mockRepository)
            ).rejects.toThrow(new ApiError('Institution not found', 404));

            expect(mockRepository.archive).not.toHaveBeenCalled();
        });

        it('should throw 403 when user does not own institution', async () => {
            const mockInstitution: PlaidItem = {
                id: 1,
                user_id: 'different-user',
                plaid_item_id: 'item-123',
                plaid_access_token: 'encrypted',
                plaid_institution_id: 'ins_1',
                institution_name: 'Test Bank',
                sync_status: 'good' as ItemStatus,
                last_successful_sync: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                archived_at: null,
            };

            mockRepository.findById.mockResolvedValue(mockInstitution);

            await expect(
                archiveInstitution('user-123', 1, mockRepository)
            ).rejects.toThrow(new ApiError('You do not have permission to archive this institution', 403));

            expect(mockRepository.archive).not.toHaveBeenCalled();
        });
    });
});
