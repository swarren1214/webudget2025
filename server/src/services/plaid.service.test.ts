// server/src/services/plaid.service.test.ts

import { createLinkToken, PlaidLinkTokenCreateFn } from './plaid.service';
import { LinkTokenCreateResponse } from 'plaid';

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
});
