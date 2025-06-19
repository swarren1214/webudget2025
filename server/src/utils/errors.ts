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
