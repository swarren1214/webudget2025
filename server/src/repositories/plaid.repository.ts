// server/src/repositories/plaid.repository.ts

import { PoolClient } from 'pg';
import { ItemStatus } from 'plaid';

export interface PlaidItemToCreate {
    userId: string;
    encryptedAccessToken: string;
    plaidItemId: string;
    plaidInstitutionId: string;
    institutionName: string;
}

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
 * @deprecated Use PostgresPlaidItemRepository.create() instead
 * This function will be removed in the next major version
 * 
 * Creates a new Plaid item in the database.
 * This function now focuses ONLY on the data insertion logic.
 * Transaction management is handled by the caller.
 * 
 * @param dbClient - A database client (may be within a transaction)
 * @param itemData - The data for the new Plaid item
 * @returns The newly created Plaid item
 */
export const createPlaidItem = async (
    dbClient: PoolClient,
    itemData: PlaidItemToCreate
): Promise<PlaidItem> => {
    const itemInsertQuery = `
        INSERT INTO plaid_items (
            user_id, 
            plaid_access_token, 
            plaid_item_id, 
            plaid_institution_id, 
            institution_name
        )
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
    return itemResult.rows[0];
};

// Future: When you implement the background jobs table
export const createBackgroundJob = async (
    dbClient: PoolClient,
    jobType: string,
    payload: any
): Promise<void> => {
    const jobInsertQuery = `
        INSERT INTO background_jobs (job_type, payload)
        VALUES ($1, $2);
    `;

    await dbClient.query(jobInsertQuery, [jobType, JSON.stringify(payload)]);
};
