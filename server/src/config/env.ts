// server/src/config/env.ts
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';


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
});

let config: z.infer<typeof envSchema>;

try {
    // 1. Validate process.env against the schema
    config = envSchema.parse(process.env);
} catch (error) {
    // 2. If validation fails, format the error for readability
    const validationError = fromZodError(error as z.ZodError);

    // 3. Log the friendly error message and exit
    console.error('FATAL_ERROR: Invalid environment variables found.');
    console.error(validationError.toString());
    process.exit(1);
}

// 4. Export the validated and typed configuration object
export default config;