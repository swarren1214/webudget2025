// server/src/services/plaid.service.test.ts

import { createLinkToken, PlaidLinkTokenCreateFn } from './plaid.service';
import { LinkTokenCreateResponse } from 'plaid';
import { exchangePublicToken, EncryptFn, PlaidExchangeTokenFn, PlaidGetInstitutionFn } from './plaid.service';
import { createPlaidItem, PlaidItem } from '../repositories/plaid.repository';
import { Pool } from 'pg';

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
            // --- ARRANGE ---
            const userId = 'user-123';

            // --- ACT ---
            // We call our service, injecting the mock that simulates a successful API call.
            const result = await createLinkToken(userId, mockPlaidClientSuccess);

            // --- ASSERT ---
            // 1. Check that the result from our service is what we expect.
            expect(result).toEqual({
                linkToken: mockPlaidSuccessResponse.link_token,
                expiration: mockPlaidSuccessResponse.expiration,
            });

            // 2. Check that our mock dependency was called correctly.
            expect(mockPlaidClientSuccess).toHaveBeenCalledTimes(1);
            expect(mockPlaidClientSuccess).toHaveBeenCalledWith({
                user: { client_user_id: userId },
                client_name: 'WeBudget',
                products: ['transactions'],
                language: 'en',
                country_codes: ['US'],
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
        const mockPlaidExchangeResponse = { access_token: 'real-access-token', item_id: 'plaid-item-id-xyz', institution_id: 'ins_1' };
        const mockPlaidInstitutionResponse = { institution: { name: 'Test Bank' } };
        const mockEncryptedToken = 'encrypted-token-string';

        // This is the fully defined mock object
        const mockNewPlaidItem: PlaidItem = {
            id: 1,
            user_id: 'user-123',
            plaid_item_id: 'plaid-item-id-xyz',
            plaid_access_token: 'encrypted-token-string',
            plaid_institution_id: 'ins_1',
            institution_name: 'Test Bank',
            sync_status: 'good',
            last_successful_sync: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const mockPlaidExchange: PlaidExchangeTokenFn = jest.fn().mockResolvedValue(mockPlaidExchangeResponse);
        const mockPlaidGetInstitution: PlaidGetInstitutionFn = jest.fn().mockResolvedValue(mockPlaidInstitutionResponse);
        const mockEncrypt: EncryptFn = jest.fn().mockReturnValue(mockEncryptedToken);
        const mockCreatePlaidItem: jest.MockedFunction<typeof createPlaidItem> = jest.fn().mockResolvedValue(mockNewPlaidItem);

        const mockDbClient = { release: jest.fn() };
        const mockDbPool = { connect: jest.fn().mockResolvedValue(mockDbClient) } as unknown as Pool;

        beforeEach(() => jest.clearAllMocks());

        it('should correctly orchestrate token exchange, encryption, and item creation', async () => {
            const userId = 'user-123';
            const publicToken = 'public-token-abc';

            const result = await exchangePublicToken(
                mockDbPool,
                mockPlaidExchange,
                mockPlaidGetInstitution,
                mockEncrypt,
                mockCreatePlaidItem,
                userId,
                publicToken
            );

            expect(result).toEqual(mockNewPlaidItem);
            expect(mockPlaidExchange).toHaveBeenCalledWith({ public_token: publicToken });
            expect(mockPlaidGetInstitution).toHaveBeenCalledWith({ institution_id: 'ins_1', country_codes: ['US'] });
            expect(mockEncrypt).toHaveBeenCalledWith('real-access-token');
            expect(mockDbPool.connect).toHaveBeenCalledTimes(1);
            expect(mockCreatePlaidItem).toHaveBeenCalledWith(mockDbClient, {
                userId: userId,
                encryptedAccessToken: mockEncryptedToken,
                plaidItemId: 'plaid-item-id-xyz',
                plaidInstitutionId: 'ins_1',
                institutionName: 'Test Bank',
            });
            expect(mockDbClient.release).toHaveBeenCalledTimes(1);
        });

        it('should release the db client even if an error occurs', async () => {
            const error = new Error('Plaid exchange failed');
            (mockPlaidExchange as jest.Mock).mockRejectedValueOnce(error);

            await expect(
                exchangePublicToken(
                    mockDbPool,
                    mockPlaidExchange,
                    mockPlaidGetInstitution,
                    mockEncrypt,
                    mockCreatePlaidItem,
                    'user-123',
                    'public-token'
                )
            ).rejects.toThrow(error);

            expect(mockDbClient.release).toHaveBeenCalledTimes(1);
        });
    });
});
