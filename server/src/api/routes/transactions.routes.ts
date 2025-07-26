import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';
import { getTransactionsHandler, updateTransactionHandler } from '../../controllers/transactions.controller';
import { supabase } from '../../config/supabaseClient';

const router = Router();

router.get('/', authMiddleware, asyncHandler(getTransactionsHandler));
router.patch('/:transactionId', authMiddleware, asyncHandler(updateTransactionHandler));
router.get('/recent', authMiddleware, asyncHandler(async (req, res) => {
  const recentTransactions = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .limit(10);

  if (recentTransactions.error) {
    throw new Error(recentTransactions.error.message);
  }

  res.status(200).json(recentTransactions.data);
}));

export default router;