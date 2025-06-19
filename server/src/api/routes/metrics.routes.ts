// server/src/api/routes/metrics.routes.ts
import { Router } from 'express';
import { getMetrics } from '../../controllers/metrics.controller';

const router = Router();

// The metrics endpoint should be at the root, e.g., GET /metrics
router.get('/metrics', getMetrics);

export default router;