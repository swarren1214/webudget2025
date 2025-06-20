// server/src/api/routes/v1.routes.ts

import { Router, Request, Response } from 'express';
import plaidRouter from './plaid.routes';
import institutionRouter from './institution.routes';

const router = Router();

// Test route for the V1 API
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to the WeBudget API v1' });
});

// Mount the route modules
router.use('/plaid', plaidRouter);
router.use('/institutions', institutionRouter);

export default router;