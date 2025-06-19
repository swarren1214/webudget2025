import { Request, Response, NextFunction } from 'express';
import { ApiError, ERROR_CODES } from '../utils/errors';
import logger from '../logger';
import { AuthRequest } from './auth.middleware';

interface ErrorResponse {
    error: {
        code: string;
        message: string;
        requestId?: string;
        details?: any;
    };
}

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // If response was already sent, delegate to default Express error handler
    if (res.headersSent) {
        return next(error);
    }

    // Extract user ID if available (from authenticated requests)
    const userId = (req as AuthRequest).user?.id || 'anonymous';

    // Log the error with full context
    req.log.error({
        err: error,
        userId,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
    }, 'Request failed');

    // Prepare the error response
    let errorResponse: ErrorResponse;
    let statusCode: number;

    if (error instanceof ApiError) {
        // Handle our custom errors
        const errorName = error.constructor.name;
        const errorCode = ERROR_CODES[errorName] || 'API_ERROR';

        statusCode = error.statusCode;
        errorResponse = {
            error: {
                code: errorCode,
                message: error.message,
                requestId: req.id as string,
            }
        };

        // Include additional details for validation errors
        if ('details' in error && error.details) {
            errorResponse.error.details = error.details;
        }
    } else if (error.name === 'JsonWebTokenError') {
        // Handle JWT errors
        statusCode = 401;
        errorResponse = {
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid authentication token',
                requestId: req.id as string,
            }
        };
    } else if (error.name === 'TokenExpiredError') {
        // Handle expired JWT
        statusCode = 401;
        errorResponse = {
            error: {
                code: 'TOKEN_EXPIRED',
                message: 'Authentication token has expired',
                requestId: req.id as string,
            }
        };
    } else {
        // Handle unknown errors - don't leak internal details
        statusCode = 500;
        errorResponse = {
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
                requestId: req.id as string,
            }
        };

        // Log the full error for debugging
        req.log.error({
            err: error,
            stack: error.stack,
        }, 'Unhandled error occurred');
    }

    // Send the error response
    res.status(statusCode).json(errorResponse);
};

// Async error wrapper for routes that might not properly catch errors
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
