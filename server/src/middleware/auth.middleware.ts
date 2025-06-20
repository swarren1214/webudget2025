// server/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
    throw new Error('FATAL_ERROR: JWT_SECRET is not defined.');
}

interface JwtPayload {
    sub: string;
}

// Extend the Express Request type properly
export interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

// Fix the type casting issue
export const authMiddleware = (
    req: Request, // Use base Request type here
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Authorization header is missing or malformed.');
        }

        const token = authHeader.split(' ')[1];
        const decoded = verify(token, JWT_SECRET) as JwtPayload;

        // Cast to AuthRequest when setting user
        (req as AuthRequest).user = { id: decoded.sub };

        next();
    } catch (error) {
        next(new UnauthorizedError('Invalid or expired token.'));
    }
};