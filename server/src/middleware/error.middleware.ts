import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
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

/**
 * Interface for error classification and response mapping
 */
interface ErrorClassification {
    statusCode: number;
    errorCode: string;
    message: string;
    details?: any;
}

/**
 * Logs error with full request context
 */
const logErrorWithContext = (error: Error, req: AuthRequest): void => {
    const userId = req.user?.id || 'anonymous';

    if (req.log && typeof req.log.error === 'function') {
        req.log.error({
            err: error,
            userId,
            path: req.path,
            method: req.method,
            body: req.body,
            query: req.query,
            params: req.params,
        }, 'Request failed');
    } else {
        // Fallback to logger if req.log is not available
        logger.error({
            err: error,
            userId,
            path: req.path,
            method: req.method,
            body: req.body,
            query: req.query,
            params: req.params,
        }, 'Request failed');
    }
};

/**
 * Classifies error and determines appropriate response details
 */
const classifyError = (error: Error, req: AuthRequest): ErrorClassification => {
    if (error instanceof ApiError) {
        // Handle our custom errors
        const errorName = error.constructor.name;
        const errorCode = ERROR_CODES[errorName] || 'API_ERROR';

        const classification: ErrorClassification = {
            statusCode: error.statusCode,
            errorCode,
            message: error.message,
        };

        // Include additional details for validation errors
        if ('details' in error && error.details) {
            classification.details = error.details;
        }

        return classification;
    }

    if (error.name === 'JsonWebTokenError') {
        return {
            statusCode: 401,
            errorCode: 'INVALID_TOKEN',
            message: 'Invalid authentication token',
        };
    }

    if (error.name === 'TokenExpiredError') {
        return {
            statusCode: 401,
            errorCode: 'TOKEN_EXPIRED',
            message: 'Authentication token has expired',
        };
    }

    // Handle unknown errors - don't leak internal details
    // Log the full error for debugging
    if (req.log && typeof req.log.error === 'function') {
        req.log.error({
            err: error,
            stack: error.stack,
        }, 'Unhandled error occurred');
    } else {
        // Fallback to logger if req.log is not available
        logger.error({
            err: error,
            stack: error.stack,
        }, 'Unhandled error occurred');
    }

    return {
        statusCode: 500,
        errorCode: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
    };
};

/**
 * Creates a standardized error response
 */
const createErrorResponse = (classification: ErrorClassification, requestId: string): ErrorResponse => {
    const errorResponse: ErrorResponse = {
        error: {
            code: classification.errorCode,
            message: classification.message,
            requestId,
        }
    };

    if (classification.details) {
        errorResponse.error.details = classification.details;
    }

    return errorResponse;
};

/**
 * Main error handler middleware with delegated responsibilities
 */
// Adjust typings for `errorHandler` to ensure compatibility
export const errorHandler: ErrorRequestHandler = (
    error,
    req,
    res,
    next
) => {
    const authReq = req as unknown as AuthRequest;

    // If response was already sent, delegate to default Express error handler
    if (res.headersSent) {
        return next(error);
    }

    // Log the error with full context
    logErrorWithContext(error, authReq);

    // Classify the error and determine response details
    const classification = classifyError(error, authReq);

    // Ensure `authReq.id` is converted to a string
    const errorResponse = createErrorResponse(classification, String(authReq.id ?? 'unknown'));
    // Send the error response
    res.status(classification.statusCode).json(errorResponse);
};

// Async error wrapper for routes that might not properly catch errors
// Adjust typings for `asyncHandler` to ensure compatibility
export const asyncHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req as unknown as AuthRequest, res, next)).catch(next);
    };
};
