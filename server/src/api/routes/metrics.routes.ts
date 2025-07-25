// server/src/api/routes/metrics.routes.ts

import { Router } from 'express';
import { getMetrics } from '../../controllers/metrics.controller';
import asyncHandler from '../../middleware/asyncHandler';

const router = Router();

// GET /metrics
router.get('/metrics', asyncHandler(getMetrics));

export default router;
