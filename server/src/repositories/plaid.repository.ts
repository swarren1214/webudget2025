// server/src/repositories/plaid.repository.ts

import { PoolClient } from 'pg';

// Defines the data structure needed to create a new Plaid item in the database.
export interface PlaidItemToCreate {
    userId: string;
    encryptedAccessToken: string;
    plaidItemId: string;
    plaidInstitutionId: string;
    institutionName: string;
}

// Defines the structure of the Plaid item as it exists in the database.
// This interface is based on the columns defined in the migration script.
// Note: snake_case is used to match the database column names directly.
export type ItemStatus = 'good' | 'syncing' | 'relink_required' | 'error';

export interface PlaidItem {
    id: number;
    user_id: string;
    plaid_item_id: string;
    plaid_access_token: string;
    plaid_institution_id: string;
    institution_name: string;
    sync_status: ItemStatus;
    last_successful_sync: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Creates a new Plaid item and a corresponding initial sync job in a single transaction.
 * @param dbClient - A 'pg' PoolClient to ensure all operations are on the same connection.
 * @param itemData - The data for the new Plaid item.
 * @returns The newly created Plaid item from the database.
 */
export const createPlaidItem = async (
    dbClient: PoolClient,
    itemData: PlaidItemToCreate
): Promise<PlaidItem> => {
    try {
        // Start the transaction
        await dbClient.query('BEGIN');

        // 1. Insert the new Plaid item
        const itemInsertQuery = `
      INSERT INTO plaid_items (user_id, plaid_access_token, plaid_item_id, plaid_institution_id, institution_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
        const itemValues = [
            itemData.userId,
            itemData.encryptedAccessToken,
            itemData.plaidItemId,
            itemData.plaidInstitutionId,
            itemData.institutionName,
        ];
        const itemResult = await dbClient.query(itemInsertQuery, itemValues);
        const newItem: PlaidItem = itemResult.rows[0];

        // 2. Queue the initial sync job for the new item
        // Note: The schema for 'background_jobs' doesn't exist in the initial migration.
        // This will be addressed when we build the background worker. For now, we comment it out.
        /*
        const jobInsertQuery = `
          INSERT INTO background_jobs (job_type, payload)
          VALUES ('INITIAL_SYNC', $1);
        `;
        const jobValues = [{ item_id: newItem.id }];
        await dbClient.query(jobInsertQuery, jobValues);
        */

        // Commit the transaction
        await dbClient.query('COMMIT');

        return newItem;
    } catch (error) {
        // If any error occurs, roll back the transaction
        await dbClient.query('ROLLBACK');
        // Re-throw the error to be handled by the service layer
        throw error;
    }
};
