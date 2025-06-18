// src/api/routes/index.ts
import { Router, Request, Response } from 'express';

const router = Router();

// Test route for the V1 API
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to the WeBudget API v1' });
});

// We will import other route files here later
// e.g., router.use('/plaid', plaidRoutes);

export default router;