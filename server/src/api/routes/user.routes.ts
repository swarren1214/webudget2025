// server/src/api/routes/user.routes.ts

import { Router } from 'express';
import { markUserOnboarded } from '../../controllers/user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

router.patch('/onboarding', authMiddleware, asyncHandler(markUserOnboarded));

export default router;
