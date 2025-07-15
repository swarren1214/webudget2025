// server/src/middleware/auth.middleware.test.ts

import { NextFunction, Response } from 'express';
import { sign } from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from './auth.middleware';
import { UnauthorizedError } from '../utils/errors';
import { expect } from '@jest/globals';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET as string;

describe('Authentication Middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        nextFunction = jest.fn();
    });

    describe('authMiddleware', () => {
        it('should return UnauthorizedError if no auth header is provided', () => {
            mockRequest.headers = {};
            
            authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
            
            expect(nextFunction).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Authorization header is missing or malformed.',
                    statusCode: 401
                })
            );
        });

        it('should return UnauthorizedError if auth header does not start with Bearer', () => {
            mockRequest.headers = {
                authorization: 'Basic some-token'
            };
            
            authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
            
            expect(nextFunction).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Authorization header is missing or malformed.',
                    statusCode: 401
                })
            );
        });

        it('should return UnauthorizedError for invalid token', () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid-token'
            };
            
            authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
            
            expect(nextFunction).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invalid token format.',
                    statusCode: 401
                })
            );
        });

        it('should return UnauthorizedError for expired token', () => {
            const expiredToken = sign(
                { sub: 'test-user-id' },
                SUPABASE_JWT_SECRET,
                { expiresIn: '-1h' } // Expired 1 hour ago
            );
            
            mockRequest.headers = {
                authorization: `Bearer ${expiredToken}`
            };
            
            authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
            
            expect(nextFunction).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Token has expired.',
                    statusCode: 401
                })
            );
        });

        it('should successfully authenticate with valid token and attach user info', () => {
            const validToken = sign(
                { 
                    sub: 'test-user-id',
                    email: 'test@example.com',
                    role: 'user'
                },
                SUPABASE_JWT_SECRET,
                { expiresIn: '1h' }
            );
            
            mockRequest.headers = {
                authorization: `Bearer ${validToken}`
            };
            
            authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
            
            expect(mockRequest.user).toEqual({
                id: 'test-user-id',
                email: 'test@example.com',
                role: 'user'
            });
            expect(nextFunction).toHaveBeenCalledWith(); // Called without error
        });

        it('should handle token without optional fields', () => {
            const minimalToken = sign(
                { sub: 'test-user-id' },
                SUPABASE_JWT_SECRET,
                { expiresIn: '1h' }
            );
            
            mockRequest.headers = {
                authorization: `Bearer ${minimalToken}`
            };
            
            authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
            
            expect(mockRequest.user).toEqual({
                id: 'test-user-id',
                email: undefined,
                role: undefined
            });
            expect(nextFunction).toHaveBeenCalledWith(); // Called without error
        });
    });
});

