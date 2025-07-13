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
import { ApiError, ValidationError, ConflictError, handleDatabaseConstraintError, DATABASE_CONSTRAINTS } from '../utils/errors';
import { validateUserId, validatePlaidPublicToken } from '../utils/validation';
import { PlaidItem } from '../repositories/interfaces/plaid-types';
import { PlaidItemRepository } from '../repositories/interfaces/plaid-item.repository.interface';

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
 * Context object containing all infrastructure dependencies for token exchange
 */
export interface PlaidTokenExchangeContext {
    plaidExchangeToken: PlaidExchangeTokenFn;
    plaidItemGet: PlaidItemGetFn;
    plaidGetInstitution: PlaidGetInstitutionFn;
    encrypt: EncryptFn;
    unitOfWork: UnitOfWork;
}

/**
 * Request object containing business data for token exchange
 */
export interface ExchangeTokenRequest {
    userId: string;
    publicToken: string;
}

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
 * Validates input parameters for exchangePublicToken function
 */
const validateExchangePublicTokenInput = (userId: string, publicToken: string): void => {
    validateUserId(userId);
    validatePlaidPublicToken(publicToken);
};

/**
 * Interface for Plaid item data needed for database creation
 */
interface PlaidItemData {
    accessToken: string;
    itemId: string;
    institutionId: string;
    institutionName: string;
}

/**
 * Fetches comprehensive Plaid item data from Plaid APIs
 */
const fetchPlaidItemData = async (
    publicToken: string,
    plaidExchangeToken: PlaidExchangeTokenFn,
    plaidItemGet: PlaidItemGetFn,
    plaidGetInstitution: PlaidGetInstitutionFn
): Promise<PlaidItemData> => {
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

    return {
        accessToken,
        itemId,
        institutionId,
        institutionName,
    };
};

/**
 * Creates Plaid item and initial sync job atomically
 */
const createPlaidItemWithSync = async (
    userId: string,
    encryptedAccessToken: string,
    itemData: PlaidItemData,
    unitOfWork: UnitOfWork
): Promise<PlaidItem> => {
    return unitOfWork.executeTransaction(async () => {
        try {
            const newItem = await unitOfWork.plaidItems.create({
                userId,
                encryptedAccessToken,
                plaidItemId: itemData.itemId,
                plaidInstitutionId: itemData.institutionId,
                institutionName: itemData.institutionName,
            });

            // Queue a background job for the initial transaction sync
            await unitOfWork.backgroundJobs.create({
                jobType: 'INITIAL_SYNC',
                payload: { itemId: newItem.id, userId: userId },
            });

            return newItem;
        } catch (dbError: any) {
            // Handle idempotency: convert database constraint violations to meaningful errors
            handleDatabaseConstraintError(dbError, DATABASE_CONSTRAINTS.PLAID_ITEM_UNIQUE, itemData.itemId);
            // TypeScript doesn't realize handleDatabaseConstraintError never returns, so we need this
            throw new Error('This line should never be reached');
        }
    });
};

/**
 * Handles Plaid-specific API errors with appropriate error types
 */
const handlePlaidApiError = (error: any): never => {
    // Re-throw ValidationError, ConflictError, and other ApiErrors as they are
    if (error instanceof ValidationError || error instanceof ConflictError || error instanceof ApiError) {
        throw error;
    }

    // Handle Plaid API errors with more context
    if (error.error_code === 'INVALID_PUBLIC_TOKEN') {
        throw new ValidationError('The provided public token is invalid or expired');
    }
    
    if (error.error_code === 'PUBLIC_TOKEN_EXCHANGE_FAILED') {
        throw new ApiError('Failed to exchange public token with Plaid', 502);
    }

    // Wrap unexpected errors
    throw new ApiError(`Token exchange failed: ${error.message}`, 500);
};

/**
 * Exchanges a public token for an access token and creates a new Plaid item.
 * 
 * @param context - Infrastructure dependencies for token exchange
 * @param request - Business data for the token exchange
 * @returns Promise resolving to the created PlaidItem
 */
export const exchangePublicToken = async (
    context: PlaidTokenExchangeContext,
    request: ExchangeTokenRequest
): Promise<PlaidItem> => {
    // Input validation
    validateExchangePublicTokenInput(request.userId, request.publicToken);

    try {
        // Fetch all required Plaid data
        const itemData = await fetchPlaidItemData(
            request.publicToken,
            context.plaidExchangeToken,
            context.plaidItemGet,
            context.plaidGetInstitution
        );

        // Encrypt the access token before storing
        const encryptedAccessToken = context.encrypt(itemData.accessToken);

        // Create the database records atomically
        return await createPlaidItemWithSync(
            request.userId,
            encryptedAccessToken,
            itemData,
            context.unitOfWork
        );
    } catch (error: any) {
        handlePlaidApiError(error);
        // TypeScript doesn't realize handlePlaidApiError never returns, so we need this
        throw new Error('This line should never be reached');
    }
};

/**
 * Legacy function signature for backward compatibility
 * @deprecated Use the version with PlaidTokenExchangeContext instead
 */
export const exchangePublicTokenLegacy = async (
    plaidExchangeToken: PlaidExchangeTokenFn,
    plaidItemGet: PlaidItemGetFn,
    plaidGetInstitution: PlaidGetInstitutionFn,
    encrypt: EncryptFn,
    unitOfWork: UnitOfWork,
    userId: string,
    publicToken: string
): Promise<PlaidItem> => {
    const context: PlaidTokenExchangeContext = {
        plaidExchangeToken,
        plaidItemGet,
        plaidGetInstitution,
        encrypt,
        unitOfWork,
    };
    const request: ExchangeTokenRequest = {
        userId,
        publicToken,
    };
    return exchangePublicToken(context, request);
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
