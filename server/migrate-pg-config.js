require('dotenv').config({ path: '../.env' });

module.exports = {
  connectionString: process.env.DATABASE_URL,
  
  dir: 'migrations',
  
  direction: 'up',
  count: Infinity,
  dbClient: 'pg',
  
  migration_table: 'pgmigrations',
};
