/* eslint-disable @typescript-eslint/naming-convention */

exports.shorthands = undefined;

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // 1. Create users table
  pgm.createTable('users', {
    id: {
      type: 'VARCHAR(255)',
      primaryKey: true,
      comment: 'The unique user ID from Auth0 (sub claim)',
    },
    email: {
      type: 'VARCHAR(255)',
      notNull: true,
      unique: true,
    },
    full_name: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    created_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // 2. Create plaid_items table
  pgm.createTable('plaid_items', {
    id: {
      type: 'SERIAL',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(255)',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    plaid_item_id: {
      type: 'VARCHAR(255)',
      notNull: true,
      unique: true,
    },
    plaid_access_token: {
      type: 'TEXT',
      notNull: true,
      comment: 'This will be stored encrypted at the application level',
    },
    plaid_institution_id: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    institution_name: {
        type: 'VARCHAR(255)',
        notNull: true,
    },
    sync_status: {
      type: 'VARCHAR(50)',
      notNull: true,
      default: 'good', // 'good', 'syncing', 'relink_required', 'error'
    },
    last_successful_sync: {
      type: 'TIMESTAMP WITH TIME ZONE',
    },
    created_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  // Add an index on the foreign key for performance
  pgm.createIndex('plaid_items', 'user_id');

  // 3. Create accounts table
  pgm.createTable('accounts', {
    id: {
      type: 'SERIAL',
      primaryKey: true,
    },
    item_id: {
      type: 'INTEGER',
      notNull: true,
      references: 'plaid_items(id)',
      onDelete: 'CASCADE',
    },
    plaid_account_id: {
      type: 'VARCHAR(255)',
      notNull: true,
      unique: true,
    },
    name: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    mask: {
      type: 'VARCHAR(10)',
    },
    type: {
      type: 'VARCHAR(100)',
      notNull: true,
    },
    subtype: {
      type: 'VARCHAR(100)',
      notNull: true,
    },
    current_balance: {
      type: 'NUMERIC(28, 10)',
      notNull: true,
    },
    available_balance: {
      type: 'NUMERIC(28, 10)',
    },
    currency_code: {
      type: 'VARCHAR(10)',
    },
    created_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  pgm.createIndex('accounts', 'item_id');

  // 4. Create transactions table
  pgm.createTable('transactions', {
    id: {
      type: 'SERIAL',
      primaryKey: true,
    },
    account_id: {
      type: 'INTEGER',
      notNull: true,
      references: 'accounts(id)',
      onDelete: 'CASCADE',
    },
    plaid_transaction_id: {
      type: 'VARCHAR(255)',
      notNull: true,
      unique: true,
    },
    amount: {
      type: 'NUMERIC(28, 10)',
      notNull: true,
    },
    currency_code: {
      type: 'VARCHAR(10)',
    },
    date: {
      type: 'DATE',
      notNull: true,
    },
    merchant_name: {
      type: 'TEXT',
    },
    primary_category: {
      type: 'VARCHAR(255)',
    },
    is_pending: {
      type: 'BOOLEAN',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  pgm.createIndex('transactions', 'account_id');
  pgm.createIndex('transactions', 'date'); // Indexing by date is common for filtering
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  // Drop tables in the reverse order of creation due to foreign key constraints
  pgm.dropTable('transactions');
  pgm.dropTable('accounts');
  pgm.dropTable('plaid_items');
  pgm.dropTable('users');
};