// server/src/middleware/auth.middleware.test.ts

import { NextFunction, Response } from 'express';
import { sign } from 'jsonwebtoken';
import { supabaseAuthMiddleware } from './supabaseAuth.middleware';
import { expect } from '@jest/globals';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET as string;

describe('Supabase Auth Middleware', () => {
    let mockRequest: any;
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
        (nextFunction as jest.Mock).mockClear();
    });

    it('should return 401 if no auth header is present', () => {
        supabaseAuthMiddleware(mockRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it('should return 401 if auth header is not a Bearer token', () => {
        mockRequest.headers = { authorization: 'Basic some-token' };
        supabaseAuthMiddleware(mockRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it('should return 401 for an invalid or expired token', () => {
        mockRequest.headers = { authorization: 'Bearer invalid-token' };
        supabaseAuthMiddleware(mockRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: "Invalid token" });
    });

    it('should add user to the request and call next() for a valid token', () => {
        const userId = 'user-id-123';
        const token = sign({ sub: userId }, SUPABASE_JWT_SECRET, { expiresIn: '1h' });
        mockRequest.headers = { authorization: `Bearer ${token}` };

        supabaseAuthMiddleware(mockRequest, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockRequest.user).toBeDefined();
        expect(mockRequest.user.sub).toEqual(userId);
    });
});

