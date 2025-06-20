// server/src/services/plaid.service.test.ts

import { CountryCode, Products, ItemStatus } from 'plaid';
import {
    createLinkToken,
    PlaidLinkTokenCreateFn,
    exchangePublicToken,
    EncryptFn,
    PlaidExchangeTokenFn,
    PlaidGetInstitutionFn,
    PlaidItemGetFn,
    canLinkAnotherAccount,
    archiveInstitution
} from './plaid.service';
import { PlaidItemRepository } from '../repositories/interfaces/plaid-item.repository.interface';
import { PlaidItem } from '../repositories/plaid.repository';
import { ApiError } from '../utils/errors';

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

        const mockEncryptedToken = 'encrypted-token-string';
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

        // Create a mock repository - much simpler than before!
        const mockPlaidItemRepository: jest.Mocked<PlaidItemRepository> = {
            create: jest.fn().mockResolvedValue(mockNewPlaidItem),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            findByPlaidItemId: jest.fn(),
            update: jest.fn(),
            archive: jest.fn(),
            hasReachedItemLimit: jest.fn(),
        };

        beforeEach(() => jest.clearAllMocks());

        it('should correctly orchestrate token exchange and item creation', async () => {
            const userId = 'user-123';
            const publicToken = 'public-token-abc';

            const result = await exchangePublicToken(
                mockPlaidExchange,
                mockPlaidItemGet,
                mockPlaidGetInstitution,
                mockEncrypt,
                mockPlaidItemRepository,
                userId,
                publicToken
            );

            expect(result).toEqual(mockNewPlaidItem);
            expect(mockPlaidExchange).toHaveBeenCalledWith({ public_token: publicToken });
            expect(mockPlaidItemGet).toHaveBeenCalledWith({ access_token: 'real-access-token' });
            expect(mockPlaidGetInstitution).toHaveBeenCalledWith({
                institution_id: 'ins_1',
                country_codes: [CountryCode.Us]
            });
            expect(mockEncrypt).toHaveBeenCalledWith('real-access-token');
            expect(mockPlaidItemRepository.create).toHaveBeenCalledWith({
                userId: userId,
                encryptedAccessToken: mockEncryptedToken,
                plaidItemId: 'plaid-item-id-xyz',
                plaidInstitutionId: 'ins_1',
                institutionName: 'Test Bank',
            });
        });

        it('should handle Plaid exchange failures without calling repository', async () => {
            const error = new Error('Plaid exchange failed');
            (mockPlaidExchange as jest.Mock).mockRejectedValueOnce(error);

            await expect(
                exchangePublicToken(
                    mockPlaidExchange,
                    mockPlaidItemGet,
                    mockPlaidGetInstitution,
                    mockEncrypt,
                    mockPlaidItemRepository,
                    'user-123',
                    'public-token'
                )
            ).rejects.toThrow(error);

            expect(mockPlaidItemRepository.create).not.toHaveBeenCalled();
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
            };

            mockRepository.findById.mockResolvedValue(mockInstitution);

            await expect(
                archiveInstitution('user-123', 1, mockRepository)
            ).rejects.toThrow(new ApiError('You do not have permission to archive this institution', 403));

            expect(mockRepository.archive).not.toHaveBeenCalled();
        });
    });
});