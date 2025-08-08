// server/src/config/env.ts
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { ConfigurationError } from '../utils/errors';
import dotenv from 'dotenv';

// Load the .env file from the project root
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z.string().default('info'),
    DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid PostgreSQL connection string' }),
    JWT_SECRET: z.string().min(1, { message: 'JWT_SECRET is a required field' }),
    ENCRYPTION_KEY: z.string().length(64, { message: 'ENCRYPTION_KEY must be a 64-character hex string' }),
    PLAID_CLIENT_ID: z.string().min(1, { message: 'PLAID_CLIENT_ID is a required field' }),
    PLAID_SECRET: z.string().min(1, { message: 'PLAID_SECRET is a required field' }),
    PLAID_ENV: z.enum(['sandbox', 'development', 'production']),
    SUPABASE_JWT_SECRET: z.string().min(1, { message: 'SUPABASE_JWT_SECRET is a required field' }),
    SSL_CERT_PATH: z.string().default('./certs/localhost.pem'),
    SSL_KEY_PATH: z.string().default('./certs/localhost-key.pem'),
});

let config: z.infer<typeof envSchema>;

try {
    config = envSchema.parse(process.env);
} catch (error) {
    const validationError = fromZodError(error as z.ZodError);
    throw new ConfigurationError(
        'Invalid environment variables found',
        {
            message: validationError.toString(),
            errors: validationError.details
        }
    );
}

export default config;