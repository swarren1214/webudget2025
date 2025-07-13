import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../schema'; // Adjust if schema is elsewhere
import dotenv from 'dotenv';

dotenv.config();

// Create a native pg connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Drizzle ORM-wrapped database
const db = drizzle(pool, { schema });

// Export both for flexibility
export { db, pool };

/**
 * A simple utility to check database connectivity by running a trivial query.
 * It abstracts the underlying 'pg' library from the services that use it.
 * Throws an error if the connection fails, which can be caught by the caller.
 */
export const checkConnection = async () => {
  await pool.query('SELECT 1');
};
