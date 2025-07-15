// server/src/services/institution.service.ts

import { PlaidItemRepository } from '../repositories/interfaces/plaid-item.repository.interface';
import { PlaidItem } from '../repositories/interfaces/plaid-types';
import { NotFoundError } from '../utils/errors';

/**
 * Gets an institution for a specific user with optimized database access
 * This method combines the institution lookup and ownership verification in a single query
 * 
 * @param institutionId - The internal database ID of the institution
 * @param userId - The user's ID who should own the institution
 * @param repository - The PlaidItemRepository instance
 * @returns Promise resolving to the PlaidItem if found and owned by user
 * @throws {NotFoundError} If the institution is not found or not owned by the user
 */
export const getInstitutionForUser = async (
    institutionId: number,
    userId: string,
    repository: PlaidItemRepository
): Promise<PlaidItem> => {
    const institution = await repository.findByIdAndUserId(institutionId, userId);
    
    if (!institution) {
        throw new NotFoundError('Institution not found');
    }
    
    return institution;
};

/**
 * Validates and parses institution ID from string
 * This is a utility function that can be used by controllers
 * 
 * @param institutionId - The institution ID as a string
 * @returns The parsed institution ID as a number
 * @throws {NotFoundError} If the institution ID is not a valid number
 */
export const parseInstitutionId = (institutionId: string): number => {
    const id = parseInt(institutionId, 10);
    if (isNaN(id)) {
        throw new NotFoundError('Invalid institution ID');
    }
    return id;
}; 