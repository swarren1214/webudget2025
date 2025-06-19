// server/src/services/plaid.service.ts

import { LinkTokenCreateRequest, LinkTokenCreateResponse } from 'plaid';

/**
 * This is the abstraction for the Plaid client's linkTokenCreate method.
 * It allows us to inject a mock for testing without depending on the real Plaid client.
 */
export type PlaidLinkTokenCreateFn = (
    request: LinkTokenCreateRequest
) => Promise<LinkTokenCreateResponse>;

/**
 * Creates a Plaid link token for a given user.
 *
 * @param userId - The unique identifier for the user.
 * @param plaidLinkTokenCreate - The dependency-injected function to call the Plaid API.
 * @returns An object containing the link_token and its expiration.
 */
export const createLinkToken = async (
    userId: string,
    plaidLinkTokenCreate: PlaidLinkTokenCreateFn
) => {
    // This is the request payload we will send to Plaid.
    const request: LinkTokenCreateRequest = {
        user: {
            client_user_id: userId,
        },
        client_name: 'WeBudget',
        // For the MVP, we are requesting access to Transactions.
        products: ['transactions'],
        // We can add more languages and countries as needed.
        language: 'en',
        country_codes: ['US'],
    };

    const response = await plaidLinkTokenCreate(request);

    return {
        linkToken: response.link_token,
        expiration: response.expiration,
    };
};