// server/src/repositories/interfaces/plaid-item.repository.interface.ts

import { ItemStatus } from 'plaid';
import { PlaidItem } from '../plaid.repository';

/**
 * Represents the data needed to create a new Plaid item
 */
export interface CreatePlaidItemData {
    userId: string;
    encryptedAccessToken: string;
    plaidItemId: string;
    plaidInstitutionId: string;
    institutionName: string;
}

/**
 * Represents the data needed to update a Plaid item
 */
export interface UpdatePlaidItemData {
    syncStatus?: ItemStatus;
    lastSuccessfulSync?: Date;
    lastSyncErrorMessage?: string;
}

/**
 * Repository interface for Plaid item data access
 * This interface defines the contract for any Plaid item repository implementation
 */
export interface PlaidItemRepository {
    /**
     * Creates a new Plaid item in the database
     * @param itemData - The data for the new Plaid item
     * @returns The created Plaid item
     * @throws {Error} If the item already exists or database operation fails
     */
    create(itemData: CreatePlaidItemData): Promise<PlaidItem>;

    /**
     * Finds a Plaid item by its internal ID
     * @param id - The internal database ID
     * @returns The Plaid item or null if not found
     */
    findById(id: number): Promise<PlaidItem | null>;

    /**
     * Finds all Plaid items for a specific user
     * @param userId - The user's ID
     * @returns Array of Plaid items (empty array if none found)
     */
    findByUserId(userId: string): Promise<PlaidItem[]>;

    /**
     * Finds a Plaid item by its Plaid-assigned item ID
     * @param plaidItemId - The item ID from Plaid
     * @returns The Plaid item or null if not found
     */
    findByPlaidItemId(plaidItemId: string): Promise<PlaidItem | null>;

    /**
     * Updates a Plaid item's information
     * @param id - The internal database ID
     * @param updateData - The fields to update
     * @returns The updated Plaid item
     * @throws {Error} If the item is not found
     */
    update(id: number, updateData: UpdatePlaidItemData): Promise<PlaidItem>;

    /**
     * Soft deletes a Plaid item by setting archived_at
     * @param id - The internal database ID
     * @throws {Error} If the item is not found or already archived
     */
    archive(id: number): Promise<void>;

    /**
     * Checks if a user has reached the maximum number of linked items
     * @param userId - The user's ID
     * @param maxItems - The maximum allowed items (default: 10)
     * @returns True if the limit is reached
     */
    hasReachedItemLimit(userId: string, maxItems?: number): Promise<boolean>;
}
