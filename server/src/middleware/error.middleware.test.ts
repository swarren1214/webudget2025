import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './error.middleware';
import { UnauthorizedError, ValidationError, ApiError } from '../utils/errors';

describe('Error Handler Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = {
            id: 'test-request-id',
            path: '/test',
            method: 'GET',
            log: {
                error: jest.fn(),
            } as any,
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            headersSent: false,
        };
        jest.clearAllMocks();
    });

    it('should handle UnauthorizedError correctly', () => {
        const error = new UnauthorizedError('Invalid token');

        errorHandler(
            error,
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid token',
                requestId: 'test-request-id',
            }
        });
    });

    it('should handle ValidationError with details', () => {
        const error = new ValidationError('Validation failed', {
            field: 'email',
            reason: 'Invalid format'
        });

        errorHandler(
            error,
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                requestId: 'test-request-id',
                details: {
                    field: 'email',
                    reason: 'Invalid format'
                }
            }
        });
    });

    it('should handle unknown errors without leaking details', () => {
        const error = new Error('Database connection failed');

        errorHandler(
            error,
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
                requestId: 'test-request-id',
            }
        });
    });
});
