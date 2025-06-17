require('dotenv').config();

module.exports = {
    connectionString: process.env.DATABASE_URL,

    migrations_dir: 'src/migrations',

    dir: 'src/migrations',
    direction: 'up',
    count: Infinity,
    dbClient: 'pg',

    migration_table: 'pgmigrations',
};
