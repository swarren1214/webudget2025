// server/src/utils/errors.ts

/**
 * A base class for all custom API errors.
 * It ensures that every error we throw has a status code,
 * which a future global error handler can use to send the
 * correct HTTP response.
 */
export class ApiError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        // This is necessary for custom errors in TypeScript
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

/**
 * A specific error for authentication failures (e.g., missing or invalid token).
 * It extends our base ApiError and hard-codes the 401 Unauthorized status code.
 */
export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}

export class ValidationError extends ApiError {
    constructor(message = 'Validation failed', details?: any) {
        super(message, 400);
        this.details = details;
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
    public readonly details?: any;
}

export class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(message, 404);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class ForbiddenError extends ApiError {
    constructor(message = 'Access forbidden') {
        super(message, 403);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

export class ConflictError extends ApiError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

export class TooManyRequestsError extends ApiError {
    constructor(message = 'Too many requests') {
        super(message, 429);
        Object.setPrototypeOf(this, TooManyRequestsError.prototype);
    }
}

/**
 * Database constraint error configuration for reusable error handling
 */
export interface DatabaseConstraintConfig {
    constraintName: string;
    errorCode: string;
    createMessage: (identifier?: string) => string;
}

/**
 * Common database constraint configurations
 */
export const DATABASE_CONSTRAINTS: Record<string, DatabaseConstraintConfig> = {
    PLAID_ITEM_UNIQUE: {
        constraintName: 'plaid_items_plaid_item_id_key',
        errorCode: '23505',
        createMessage: (itemId?: string) => 
            `Institution account is already connected. Plaid item ID ${itemId} already exists for this user.`
    },
    // Add more constraint configurations as needed
};

/**
 * Generic database error handler for PostgreSQL constraint violations
 * @param error - The database error
 * @param constraintConfig - Configuration for the specific constraint
 * @param identifier - Optional identifier for the error message
 */
export const handleDatabaseConstraintError = (
    error: any,
    constraintConfig: DatabaseConstraintConfig,
    identifier?: string
): void => {
    if (error.code === constraintConfig.errorCode && error.constraint === constraintConfig.constraintName) {
        throw new ConflictError(constraintConfig.createMessage(identifier));
    }
    // Re-throw other database errors as they are
    throw error;
};

// Map error names to error codes for API responses
export const ERROR_CODES: Record<string, string> = {
    ApiError: 'API_ERROR',
    UnauthorizedError: 'UNAUTHORIZED',
    ValidationError: 'VALIDATION_ERROR',
    NotFoundError: 'NOT_FOUND',
    ForbiddenError: 'FORBIDDEN',
    ConflictError: 'CONFLICT',
    TooManyRequestsError: 'TOO_MANY_REQUESTS',
};
