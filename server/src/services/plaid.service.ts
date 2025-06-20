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
import { UnitOfWork } from '../repositories/interfaces/unit-of-work.interface';
import { PlaidItem } from '../repositories/plaid.repository';
import { ApiError } from '../utils/errors';
import { PlaidItemRepository } from '../repositories/interfaces';

// Keep the same type definitions for dependency injection
export type PlaidLinkTokenCreateFn = (
    request: LinkTokenCreateRequest
) => Promise<LinkTokenCreateResponse>;

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
 * Creates a Plaid link token for a given user.
 * This function has no infrastructure dependencies.
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
            products: [Products.Transactions],
            language: 'en',
            country_codes: [CountryCode.Us],
        };
        const response = await plaidLinkTokenCreate(request);

        return {
            linkToken: response.link_token,
            expiration: response.expiration,
        };
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
            const plaidError = error as any;
            if (plaidError.response?.data?.error_code === 'INVALID_CREDENTIALS') {
                throw new ApiError('Invalid Plaid credentials', 500);
            }
        }
        throw error;
    }
};

/**
 * Exchanges a public token for an access token and creates a new Plaid item.
 *
 * Notice: This service now only knows about the repository interface.
 * It is decoupled from the database driver.
 */
export const exchangePublicToken = async (
    plaidExchangeToken: PlaidExchangeTokenFn,
    plaidItemGet: PlaidItemGetFn,
    plaidGetInstitution: PlaidGetInstitutionFn,
    encrypt: EncryptFn,
    unitOfWork: UnitOfWork, // The new dependency, an abstraction.
    userId: string,
    publicToken: string
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

    // 5. Use the Unit of Work to perform the database operations atomically.
    // This ensures that creating the item and queueing the sync job either
    // both succeed or both fail, preventing data inconsistencies.
    return unitOfWork.executeTransaction(async () => {
        const newItem = await unitOfWork.plaidItems.create({
            userId,
            encryptedAccessToken,
            plaidItemId: itemId,
            plaidInstitutionId: institutionId,
            institutionName,
        });

        // 6. Queue a background job for the initial transaction sync.
        await unitOfWork.backgroundJobs.create({
            jobType: 'INITIAL_SYNC',
            payload: { itemId: newItem.id, userId: userId },
        });

        return newItem;
    });
};

/**
 * Checks if a user can link another bank account
 */
export const canLinkAnotherAccount = async (
    userId: string,
    plaidItemRepository: PlaidItemRepository,
    maxAccounts: number = 10
): Promise<boolean> => {
    const hasReachedLimit = await plaidItemRepository.hasReachedItemLimit(userId, maxAccounts);
    return !hasReachedLimit;
};

/**
 * Gets all linked institutions for a user
 */
export const getUserInstitutions = async (
    userId: string,
    plaidItemRepository: PlaidItemRepository
): Promise<PlaidItem[]> => {
    return plaidItemRepository.findByUserId(userId);
};

/**
 * Archives a linked institution
 */
export const archiveInstitution = async (
    userId: string,
    institutionId: number,
    plaidItemRepository: PlaidItemRepository
): Promise<void> => {
    // First verify the institution belongs to the user
    const institution = await plaidItemRepository.findById(institutionId);
    if (!institution) {
        throw new ApiError('Institution not found', 404);
    }

    if (institution.user_id !== userId) {
        throw new ApiError('You do not have permission to archive this institution', 403);
    }

    await plaidItemRepository.archive(institutionId);
};
