// server/src/config/database.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * A simple utility to check database connectivity by running a trivial query.
 * It abstracts the underlying 'pg' library from the services that use it.
 * Throws an error if the connection fails, which can be caught by the caller.
 */
export const checkConnection = async () => {
    // This is the only place in our app that should run a raw,
    // infrastructure-level query like 'SELECT 1'.
    await pool.query('SELECT 1');
};

export default pool;