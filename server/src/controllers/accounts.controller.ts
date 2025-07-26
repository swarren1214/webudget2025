// server/src/controllers/accounts.controller.ts

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/auth';
import { supabase } from '../config/supabaseClient';

export const getAccountsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Fetch institutions with embedded accounts
    const { data, error } = await supabase
      .from('institutions')
      .select('accounts(*)')
      .eq('user_id', userId);

    if (error) throw error;

    // Flatten all accounts
    const accounts = data?.flatMap(inst => inst.accounts ?? []) ?? [];

    res.status(200).json({ accounts });
  } catch (err) {
    next(err);
  }
};