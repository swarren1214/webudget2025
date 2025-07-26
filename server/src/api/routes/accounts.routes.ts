// server/src/api/routes/accounts.routes.ts

import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';
import { getAccountsHandler } from '../../controllers/accounts.controller';

const router = Router();

// GET /api/v1/accounts
router.get('/', authMiddleware, asyncHandler(getAccountsHandler));

export default router;