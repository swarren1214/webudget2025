// server/src/api/routes/health.routes.ts
import { Router } from 'express';
import { getHealthStatus } from '../../controllers/health.controller';

const router = Router();

// The health check endpoint should be at the root, e.g., GET /health
router.get('/health', getHealthStatus);

export default router;