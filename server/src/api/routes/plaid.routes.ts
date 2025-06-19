// server/src/api/routes/plaid.routes.ts

import { Router } from 'express';
import { createLinkTokenHandler } from '../../controllers/plaid.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// The authMiddleware will now run before the createLinkTokenHandler.
// If authentication fails, the request will never reach the controller.
router.post('/create-link-token', authMiddleware, createLinkTokenHandler);

export default router;
