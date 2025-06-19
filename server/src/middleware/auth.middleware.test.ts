// server/src/middleware/auth.middleware.test.ts

import { NextFunction, Response } from 'express';
import { sign } from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from './auth.middleware';
import { UnauthorizedError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET as string;

describe('Auth Middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    const nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = {
            headers: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        // Clear mock calls before each test
        (nextFunction as jest.Mock).mockClear();
    });

    it('should call next() with an UnauthorizedError if no auth header is present', () => {
        authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should call next() with an UnauthorizedError if auth header is not a Bearer token', () => {
        mockRequest.headers = { authorization: 'Basic some-token' };
        authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should call next() with an UnauthorizedError for an invalid or expired token', () => {
        mockRequest.headers = { authorization: 'Bearer invalid-token' };
        authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should successfully add user to the request and call next() for a valid token', () => {
        const userId = 'user-id-123';
        const token = sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });
        mockRequest.headers = { authorization: `Bearer ${token}` };

        authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

        // Check that next() was called without an error
        expect(nextFunction).toHaveBeenCalledWith();
        // Check that the user object was attached to the request
        expect(mockRequest.user).toBeDefined();
        expect(mockRequest.user?.id).toEqual(userId);
    });
});
