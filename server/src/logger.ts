// src/logger.ts
import pino from 'pino';
import config from './config/env';

// Define the paths to redact from logs, based on the Architecture Design Document.
// This is a security best practice to prevent leaking PII.
const redactPaths = [
    'req.headers.authorization',
    'user.email',
    'user.full_name',
    'user.id', // Equivalent to user_id
    '*.user_id',
    '*.plaid_access_token',
    '*.account_name',
    '*.account_mask',
    '*.merchant_name',
    'body.email',
    'body.password', // Always redact passwords
];

const logger = pino({
    level: config.LOG_LEVEL,
    transport: config.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    } : undefined,
    redact: {
        paths: redactPaths,
        censor: '[REDACTED]',
    },
});

export default logger;