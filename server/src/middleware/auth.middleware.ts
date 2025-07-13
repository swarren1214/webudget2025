// server/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

interface JwtPayload {
  sub: string; // Supabase user ID
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('FATAL_ERROR: SUPABASE_JWT_SECRET is not defined.');
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization header is missing or malformed.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verify(token, JWT_SECRET) as JwtPayload;

    // Use type assertion to add `user` to the request
    (req as AuthRequest).user = { id: decoded.sub };

    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    next(new UnauthorizedError('Invalid or expired token.'));
  }
};
