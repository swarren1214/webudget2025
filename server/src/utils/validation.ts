// server/src/utils/validation.ts

import { ValidationError } from './errors';

/**
 * Validates that a value is a non-empty string
 */
export const validateRequiredString = (value: any, fieldName: string): void => {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new ValidationError(`${fieldName} is required and must be a non-empty string`);
    }
};

/**
 * Validates that a string matches a specific pattern
 */
export const validateStringPattern = (value: string, pattern: RegExp, fieldName: string, errorMessage: string): void => {
    if (!pattern.test(value)) {
        throw new ValidationError(`${fieldName} ${errorMessage}`);
    }
};

/**
 * Validates userId format (UUID or Auth0 ID)
 */
export const validateUserId = (userId: string): void => {
    validateRequiredString(userId, 'userId');
    
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const auth0IdRegex = /^[a-zA-Z0-9_-]+\|[a-zA-Z0-9_-]+$/;
    
    if (!uuidRegex.test(userId) && !auth0IdRegex.test(userId)) {
        throw new ValidationError('userId must be a valid UUID or Auth0 ID format');
    }
};

/**
 * Validates Plaid public token format
 */
export const validatePlaidPublicToken = (publicToken: string): void => {
    validateRequiredString(publicToken, 'publicToken');
    
    // Plaid public tokens typically start with "public-" and have specific length
    if (!publicToken.startsWith('public-') || publicToken.length < 20) {
        throw new ValidationError('publicToken must be a valid Plaid public token format');
    }
};

/**
 * Validates that required environment variables are set
 */
export const validateRequiredEnvVars = (vars: Record<string, string | undefined>): void => {
    const missingVars = Object.entries(vars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
    
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
};