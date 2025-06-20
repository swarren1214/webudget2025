// server/src/repositories/postgres-plaid-item.repository.ts

import {
    PlaidItemRepository,
    CreatePlaidItemData,
    UpdatePlaidItemData
} from './interfaces/plaid-item.repository.interface';
import { PlaidItem } from './interfaces';
import { TransactionManager } from './transaction.manager';
import logger from '../logger';

export class PostgresPlaidItemRepository implements PlaidItemRepository {
    constructor(
        private transactionManager: TransactionManager
    ) { }

    async create(itemData: CreatePlaidItemData): Promise<PlaidItem> {
        return this.transactionManager.executeInTransaction(async (client) => {
            const query = `
                INSERT INTO plaid_items (
                    user_id, 
                    plaid_access_token, 
                    plaid_item_id, 
                    plaid_institution_id, 
                    institution_name
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const values = [
                itemData.userId,
                itemData.encryptedAccessToken,
                itemData.plaidItemId,
                itemData.plaidInstitutionId,
                itemData.institutionName,
            ];

            const result = await client.query(query, values);
            logger.info('Created new Plaid item', {
                userId: itemData.userId,
                plaidItemId: itemData.plaidItemId
            });

            return result.rows[0];
        });
    }

    async findById(id: number): Promise<PlaidItem | null> {
        return this.transactionManager.executeInTransaction(async (client) => {
            const query = `
                SELECT * FROM plaid_items 
                WHERE id = $1 AND archived_at IS NULL
            `;

            const result = await client.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    async findByUserId(userId: string): Promise<PlaidItem[]> {
        return this.transactionManager.executeInTransaction(async (client) => {
            const query = `
                SELECT * FROM plaid_items 
                WHERE user_id = $1 AND archived_at IS NULL
                ORDER BY created_at DESC
            `;

            const result = await client.query(query, [userId]);
            return result.rows;
        });
    }

    async findByPlaidItemId(plaidItemId: string): Promise<PlaidItem | null> {
        return this.transactionManager.executeInTransaction(async (client) => {
            const query = `
                SELECT * FROM plaid_items 
                WHERE plaid_item_id = $1 AND archived_at IS NULL
            `;

            const result = await client.query(query, [plaidItemId]);
            return result.rows[0] || null;
        });
    }

    async update(id: number, updateData: UpdatePlaidItemData): Promise<PlaidItem> {
        return this.transactionManager.executeInTransaction(async (client) => {
            const setClauses: string[] = ['updated_at = NOW()'];
            const values: any[] = [];
            let paramCount = 1;

            if (updateData.syncStatus !== undefined) {
                setClauses.push(`sync_status = $${paramCount++}`);
                values.push(updateData.syncStatus);
            }

            if (updateData.lastSuccessfulSync !== undefined) {
                setClauses.push(`last_successful_sync = $${paramCount++}`);
                values.push(updateData.lastSuccessfulSync);
            }

            if (updateData.lastSyncErrorMessage !== undefined) {
                setClauses.push(`last_sync_error_message = $${paramCount++}`);
                values.push(updateData.lastSyncErrorMessage);
            }

            values.push(id); // Add ID as the last parameter

            const query = `
                UPDATE plaid_items 
                SET ${setClauses.join(', ')}
                WHERE id = $${paramCount} AND archived_at IS NULL
                RETURNING *
            `;

            const result = await client.query(query, values);

            if (result.rows.length === 0) {
                throw new Error(`Plaid item with ID ${id} not found`);
            }

            logger.info('Updated Plaid item', { id, updateData });
            return result.rows[0];
        });
    }

    async archive(id: number): Promise<void> {
        return this.transactionManager.executeInTransaction(async (client) => {
            const query = `
                UPDATE plaid_items 
                SET archived_at = NOW(), updated_at = NOW()
                WHERE id = $1 AND archived_at IS NULL
                RETURNING id
            `;

            const result = await client.query(query, [id]);

            if (result.rows.length === 0) {
                throw new Error(`Plaid item with ID ${id} not found or already archived`);
            }

            logger.info('Archived Plaid item', { id });
        });
    }

    async hasReachedItemLimit(userId: string, maxItems: number = 10): Promise<boolean> {
        return this.transactionManager.executeInTransaction(async (client) => {
            const query = `
                SELECT COUNT(*) as count 
                FROM plaid_items 
                WHERE user_id = $1 AND archived_at IS NULL
            `;

            const result = await client.query(query, [userId]);
            const count = parseInt(result.rows[0].count, 10);

            return count >= maxItems;
        });
    }
}
