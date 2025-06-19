// server/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

const { JWT_SECRET } = process.env;

// This is a critical runtime check to ensure the app doesn't
// start in an insecure state without the secret key.
if (!JWT_SECRET) {
    throw new Error('FATAL_ERROR: JWT_SECRET is not defined.');
}

// Define the structure of our decoded JWT payload.
interface JwtPayload {
    sub: string; // 'sub' is the standard claim for the user's ID
}

// We need to extend the Express Request type to include our 'user' property.
// This provides type safety for our controllers.
export interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Authorization header is missing or malformed.');
        }

        const token = authHeader.split(' ')[1];

        // jwt.verify will throw its own error if the token is invalid or expired.
        const decoded = verify(token, JWT_SECRET) as JwtPayload;

        // Attach the user's ID to the request object for downstream handlers.
        req.user = { id: decoded.sub };

        // Pass control to the next middleware or route handler.
        next();
    } catch (error) {
        // We catch errors from jwt.verify and our own thrown errors,
        // standardize them, and pass them to the next error-handling middleware.
        // By default, if no custom error handler is present, Express will halt.
        next(new UnauthorizedError('Invalid or expired token.'));
    }
};