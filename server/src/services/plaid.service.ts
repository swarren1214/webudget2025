// server/src/services/plaid.service.ts

import { LinkTokenCreateRequest, LinkTokenCreateResponse } from 'plaid';
import { ItemPublicTokenExchangeRequest, ItemPublicTokenExchangeResponse, InstitutionsGetByIdRequest, InstitutionsGetByIdResponse } from 'plaid';
import { Pool } from 'pg';
import { createPlaidItem, PlaidItem, PlaidItemToCreate } from '../repositories/plaid.repository';

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

export type PlaidExchangeTokenFn = (
    request: ItemPublicTokenExchangeRequest
) => Promise<ItemPublicTokenExchangeResponse>;

export type PlaidGetInstitutionFn = (
    request: InstitutionsGetByIdRequest
) => Promise<InstitutionsGetByIdResponse>;

export type EncryptFn = (text: string) => string;

type CreatePlaidItemFn = typeof createPlaidItem;

/**
 * Exchanges a public token for an access token, encrypts it,
 * and creates a new Plaid item in the database.
 *
 * @param {Pool} dbPool - The main 'pg' pool to get a client from.
 * @param {PlaidExchangeTokenFn} plaidExchangeToken - Function to call Plaid's exchange token endpoint.
 * @param {PlaidGetInstitutionFn} plaidGetInstitution - Function to call Plaid's get institution endpoint.
 * @param {EncryptFn} encrypt - Function to encrypt the access token.
 * @param {CreatePlaidItemFn} createPlaidItemInDb - The repository function to save the item.
 * @param {string} userId - The ID of the authenticated user.
 * @param {string} publicToken - The public token from the Plaid Link client.
 * @returns {Promise<PlaidItem>} The newly created Plaid item.
 */
export const exchangePublicToken = async (
    dbPool: Pool,
    plaidExchangeToken: PlaidExchangeTokenFn,
    plaidGetInstitution: PlaidGetInstitutionFn,
    encrypt: EncryptFn,
    createPlaidItemInDb: CreatePlaidItemFn,
    userId: string,
    publicToken: string,
): Promise<PlaidItem> => {
    // 1. Exchange the public token for an access token from Plaid.
    const exchangeResponse = await plaidExchangeToken({ public_token: publicToken });
    const accessToken = exchangeResponse.access_token;
    const itemId = exchangeResponse.item_id;

    // 2. Get institution details from Plaid.
    const institutionResponse = await plaidGetInstitution({
        institution_id: exchangeResponse.institution_id,
        country_codes: ['US'],
    });
    const institutionName = institutionResponse.institution.name;

    // 3. Encrypt the access token before storing it.
    const encryptedAccessToken = encrypt(accessToken);

    // 4. Prepare the data for the repository.
    const itemToCreate: PlaidItemToCreate = {
        userId,
        encryptedAccessToken,
        plaidItemId: itemId,
        plaidInstitutionId: exchangeResponse.institution_id,
        institutionName,
    };

    // 5. Get a client from the pool and save the item using the repository.
    const dbClient = await dbPool.connect();
    try {
        const newItem = await createPlaidItemInDb(dbClient, itemToCreate);
        return newItem;
    } finally {
        // Ensure the client is always released back to the pool.
        dbClient.release();
    }
};
