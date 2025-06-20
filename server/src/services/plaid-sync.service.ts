// server/src/services/plaid-sync.service.ts

import { UnitOfWork } from '../repositories/interfaces/unit-of-work.interface';
import { ItemStatus } from '../repositories/interfaces/';
import logger from '../logger';

export interface SyncResult {
    itemId: number;
    accountsSynced: number;
    transactionsSynced: number;
}

/**
 * Service responsible for syncing Plaid data
 * This demonstrates using Unit of Work for complex operations
 */
export class PlaidSyncService {
    /**
     * Initiates a sync for a Plaid item
     * This creates a background job and updates the item status in a single transaction
     */
    async initiateSyncForItem(
        itemId: number,
        unitOfWork: UnitOfWork
    ): Promise<void> {
        await unitOfWork.executeTransaction(async () => {
            // Update item status to syncing
            const syncingStatus: ItemStatus = 'syncing';
            await unitOfWork.plaidItems.update(itemId, {
                syncStatus: syncingStatus
            });

            // Create background job
            await unitOfWork.backgroundJobs.create({
                jobType: 'SYNC_PLAID_ITEM',
                payload: { itemId }
            });

            logger.info('Initiated sync for Plaid item', { itemId });
        });
    }

    /**
     * Completes a sync operation
     * Updates the item status and records the sync time
     */
    async completeSyncForItem(
        itemId: number,
        result: SyncResult,
        unitOfWork: UnitOfWork
    ): Promise<void> {
        await unitOfWork.executeTransaction(async () => {
            // Update item with successful sync
            const goodStatus: ItemStatus = 'good';
            await unitOfWork.plaidItems.update(itemId, {
                syncStatus: goodStatus,
                lastSuccessfulSync: new Date(),
                lastSyncErrorMessage: undefined
            });

            // Could also update other related data here
            // For example: update account balances, insert new transactions, etc.

            logger.info('Completed sync for Plaid item', result);
        });
    }

    /**
     * Records a sync failure
     */
    async recordSyncFailure(
        itemId: number,
        error: string,
        requiresRelink: boolean,
        unitOfWork: UnitOfWork
    ): Promise<void> {
        await unitOfWork.executeTransaction(async () => {
            const errorStatus: ItemStatus = requiresRelink ? 'relink_required' : 'error';
            await unitOfWork.plaidItems.update(itemId, {
                syncStatus: errorStatus,
                lastSyncErrorMessage: error
            });

            logger.error('Sync failed for Plaid item', { itemId, error, requiresRelink });
        });
    }
}
