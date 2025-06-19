// server/src/api/routes/plaid.routes.ts
import { Router } from 'express';
import { createLinkTokenHandler, exchangePublicTokenHandler } from '../../controllers/plaid.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

router.post(
    '/create-link-token',
    authMiddleware,
    asyncHandler(createLinkTokenHandler)
);

router.post(
    '/exchange-public-token',
    authMiddleware,
    asyncHandler(exchangePublicTokenHandler)
);

export default router;
