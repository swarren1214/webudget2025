/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 * @param {() => void | undefined} run
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Add archived_at column to plaid_items table
  pgm.addColumn('plaid_items', {
    archived_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      notNull: false,
      comment: 'Timestamp when the item was archived (soft deleted). NULL means active.'
    }
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 * @param {() => void | undefined} run
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Remove archived_at column from plaid_items table
  pgm.dropColumn('plaid_items', 'archived_at');
};
