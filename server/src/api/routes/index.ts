// server/src/api/routes/index.ts
import { Router } from 'express';
import healthRouter from './health.routes';
import metricsRouter from './metrics.routes';
import v1Router from './v1.routes';

const mainRouter = Router();

// Mount operational routes at the root level
mainRouter.use(healthRouter);
mainRouter.use(metricsRouter);

// Mount the versioned API routes under the /api/v1 prefix
mainRouter.use('/api/v1', v1Router);

export default mainRouter;