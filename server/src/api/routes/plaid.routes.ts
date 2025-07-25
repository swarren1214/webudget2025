// server/src/api/routes/plaid.routes.ts

import { Router } from 'express';
import {
  createLinkTokenHandler,
  exchangePublicTokenHandler,
} from '../../controllers/plaid.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

/**
 * These handlers are wrapped in `asyncHandler` to catch any thrown errors and
 * pass them to Express's error handling middleware.
 * 
 * The `authMiddleware` should type the request as `AuthRequest` so downstream
 * handlers can safely access `req.user`.
 */

// POST /api/plaid/create-link-token
router.post(
  '/create-link-token',
  authMiddleware,
  asyncHandler(createLinkTokenHandler)
);

// POST /api/plaid/exchange-public-token
router.post(
  '/exchange-public-token',
  authMiddleware,
  asyncHandler(exchangePublicTokenHandler)
);

export default router;
