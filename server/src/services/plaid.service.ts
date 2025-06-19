// server/src/services/plaid.service.ts

import {
    LinkTokenCreateRequest,
    LinkTokenCreateResponse,
    ItemPublicTokenExchangeRequest,
    ItemPublicTokenExchangeResponse,
    InstitutionsGetByIdRequest,
    InstitutionsGetByIdResponse,
    ItemGetRequest,
    ItemGetResponse,
    Products,
    CountryCode
} from 'plaid';
import { createPlaidItem, PlaidItem, PlaidItemToCreate } from '../repositories/plaid.repository';
import { ApiError } from '../utils/errors';
import { TransactionManager } from '../repositories/transaction.manager';

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
    try {
        const request: LinkTokenCreateRequest = {
            user: {
                client_user_id: userId,
            },
            client_name: 'WeBudget',
            products: [Products.Transactions], // Use the enum
            language: 'en',
            country_codes: [CountryCode.Us], // Use the enum
        };

        const response = await plaidLinkTokenCreate(request);

        return {
            linkToken: response.link_token,
            expiration: response.expiration,
        };
    } catch (error: unknown) { // Explicitly type as unknown
        // Type guard for error handling
        if (error && typeof error === 'object' && 'response' in error) {
            const plaidError = error as any; // Type assertion for Plaid errors
            if (plaidError.response?.data?.error_code === 'INVALID_CREDENTIALS') {
                throw new ApiError('Invalid Plaid credentials', 500);
            }
        }
        throw error;
    }
};

export type PlaidExchangeTokenFn = (
    request: ItemPublicTokenExchangeRequest
) => Promise<ItemPublicTokenExchangeResponse>;

export type PlaidGetInstitutionFn = (
    request: InstitutionsGetByIdRequest
) => Promise<InstitutionsGetByIdResponse>;

export type PlaidItemGetFn = (
    request: ItemGetRequest
) => Promise<ItemGetResponse>;

export type EncryptFn = (text: string) => string;


/**
 * Exchanges a public token for an access token, encrypts it,
 * and creates a new Plaid item in the database.
 *
 * @param {PlaidExchangeTokenFn} plaidExchangeToken - Function to call Plaid's exchange token endpoint.
 * @param {PlaidGetInstitutionFn} plaidGetInstitution - Function to call Plaid's get institution endpoint.
 * @param {EncryptFn} encrypt - Function to encrypt the access token.
 * @param {CreatePlaidItemFn} createPlaidItemInDb - The repository function to save the item.
 * @param {string} userId - The ID of the authenticated user.
 * @param {string} publicToken - The public token from the Plaid Link client.
 * @returns {Promise<PlaidItem>} The newly created Plaid item.
 */
export const exchangePublicToken = async (
    transactionManager: TransactionManager,  // Changed from Pool
    plaidExchangeToken: PlaidExchangeTokenFn,
    plaidItemGet: PlaidItemGetFn,
    plaidGetInstitution: PlaidGetInstitutionFn,
    encrypt: EncryptFn,
    userId: string,
    publicToken: string,
): Promise<PlaidItem> => {
    // 1. Exchange the public token for an access token from Plaid
    const exchangeResponse = await plaidExchangeToken({ public_token: publicToken });
    const accessToken = exchangeResponse.access_token;
    const itemId = exchangeResponse.item_id;

    // 2. Get item details to find the institution_id
    const itemGetResponse = await plaidItemGet({ access_token: accessToken });
    const institutionId = itemGetResponse.item.institution_id;

    if (!institutionId) {
        throw new ApiError('No institution_id found for this item', 500);
    }

    // 3. Get institution details
    const institutionResponse = await plaidGetInstitution({
        institution_id: institutionId,
        country_codes: [CountryCode.Us],
    });
    const institutionName = institutionResponse.institution.name;

    // 4. Encrypt the access token before storing it
    const encryptedAccessToken = encrypt(accessToken);

    // 5. Prepare the data for the repository
    const itemToCreate: PlaidItemToCreate = {
        userId,
        encryptedAccessToken,
        plaidItemId: itemId,
        plaidInstitutionId: institutionId,
        institutionName,
    };

    // 6. Use transaction manager to handle the database operation
    return transactionManager.executeInTransaction(async (client) => {
        // Create the Plaid item
        const newItem = await createPlaidItem(client, itemToCreate);

        // Future: Queue the background job
        // await createBackgroundJob(client, 'INITIAL_SYNC', { item_id: newItem.id });

        return newItem;
    });
}
