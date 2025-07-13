// server/src/api/routes/health.routes.ts
import { Router } from 'express';
import { getHealthStatus } from '../../controllers/health.controller';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

// Wrap with asyncHandler for extra safety
router.get('/health', asyncHandler(getHealthStatus));

export default router;
