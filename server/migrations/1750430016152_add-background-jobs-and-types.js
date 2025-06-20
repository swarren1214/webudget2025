/* eslint-disable @typescript-eslint/naming-convention */

exports.shorthands = undefined;

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
    // Create the ENUM types for data integrity
    pgm.createType('item_status', ['good', 'syncing', 'relink_required', 'error']);
    pgm.createType('job_status', ['queued', 'running', 'completed', 'failed']);

    // --- Explicitly alter the plaid_items.sync_status column in stages ---

    // 1. Drop the old text-based default value
    pgm.alterColumn('plaid_items', 'sync_status', {
        default: null,
    });

    // 2. Change the column type, casting existing data to the new ENUM type
    pgm.alterColumn('plaid_items', 'sync_status', {
        type: 'item_status',
        using: 'sync_status::item_status',
    });

    // 3. Set the new default value using the new ENUM type
    pgm.alterColumn('plaid_items', 'sync_status', {
        default: 'good',
    });

    // 4. Create the missing background_jobs table
    pgm.createTable('background_jobs', {
        id: { type: 'SERIAL', primaryKey: true },
        job_type: { type: 'TEXT', notNull: true },
        payload: { type: 'JSONB' },
        status: { type: 'job_status', notNull: true, default: 'queued' },
        last_attempt_at: { type: 'TIMESTAMPTZ' },
        last_error: { type: 'TEXT' },
        attempts: { type: 'INTEGER', notNull: true, default: 0 },
        created_at: { type: 'TIMESTAMPTZ', notNull: true, default: pgm.func('current_timestamp') },
    });
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
    pgm.dropTable('background_jobs');

    // Revert the plaid_items column back to its original VARCHAR type if rolling back
    pgm.alterColumn('plaid_items', 'sync_status', {
        type: 'VARCHAR(50)',
        default: 'good',
    });

    pgm.dropType('job_status');
    pgm.dropType('item_status');
};