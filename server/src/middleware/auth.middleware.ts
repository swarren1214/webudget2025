// server/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
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

// Create a remote JWKS for Supabase
const JWKS = createRemoteJWKSet(new URL('https://lwnkjhtiljspretoxrru.supabase.co/auth/v1/keys'));

// Main authentication middleware using Supabase JWT
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Authorization Header:', req.headers.authorization);
        console.log('Incoming Headers:', req.headers);

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            console.error('Authorization header is missing.');
            throw new UnauthorizedError('Authorization header is required.');
        }

        if (!authHeader.startsWith('Bearer ')) {
            console.error('Authorization header is malformed:', authHeader);
            throw new UnauthorizedError('Authorization header must start with "Bearer".');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.error('Token is missing in the Authorization header.');
            throw new UnauthorizedError('Token is required.');
        }

        // Verify the token using the JWKS
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: 'https://lwnkjhtiljspretoxrru.supabase.co/auth/v1',
        });

        console.log('JWT Payload:', payload);

        // Attach user info to the request
        const authReq = req as AuthRequest;
        authReq.user = {
            id: payload.sub as string,
            email: payload.email as string,
            role: payload.role as string,
        };

        next();
    } catch (error) {
        console.error('JWT Verification Error:', error);

        if (error instanceof Error) {
            if (error.message.includes('ERR_JWKS_NO_MATCHING_KEY')) {
                console.error('No matching key found in JWKS for the token.');
            } else if (error.message.includes('ERR_JWT_EXPIRED')) {
                console.error('JWT has expired.');
            } else if (error.message.includes('ERR_JWT_INVALID')) {
                console.error('JWT is invalid.');
            } else {
                console.error('Unknown JWT verification error:', error.message);
            }
        }

        if (error instanceof UnauthorizedError) {
            next(error);
            return;
        }

        next(new UnauthorizedError('Token verification failed.'));  
    }
};