// server/src/controllers/user.controller.ts

import { Request, Response, NextFunction } from 'express';
import { db } from '@/config/database';
import { eq } from 'drizzle-orm';
import { users } from '../schema';
import { AuthRequest } from '../middleware/auth.middleware';
import { UnauthorizedError } from '../utils/errors';

export const markUserOnboarded = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    await db
      .update(users)
      .set({ has_onboarded: true })
      .where(eq(users.supabase_user_id, userId));

    res.status(200).json({ message: 'User marked as onboarded' });
  } catch (err) {
    next(err);
  }
};