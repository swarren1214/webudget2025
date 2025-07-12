// server/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';
import config from '../config/env';

interface SupabaseJwtPayload {
    sub: string;
    email?: string;
    aud?: string;
    role?: string;
    iat?: number;
    exp?: number;
}

// Extend the Express Request type properly
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
        role?: string;
    };
}

// Main authentication middleware using Supabase JWT
export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Authorization header is missing or malformed.');
        }

        const token = authHeader.split(' ')[1];
        
        // Verify the token using the Supabase JWT secret
        const decoded = verify(token, config.SUPABASE_JWT_SECRET) as SupabaseJwtPayload;
        
        // Cast to AuthRequest and attach user info
        const authReq = req as AuthRequest;
        authReq.user = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        // Handle JWT verification errors
        if (error instanceof Error) {
            if (error.name === 'TokenExpiredError') {
                next(new UnauthorizedError('Token has expired.'));
            } else if (error.name === 'JsonWebTokenError') {
                next(new UnauthorizedError('Invalid token format.'));
            } else {
                next(new UnauthorizedError('Token verification failed.'));
            }
        } else {
            next(new UnauthorizedError('Invalid or expired token.'));
        }
    }
};