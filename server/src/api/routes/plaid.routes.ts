// server/src/api/routes/plaid.routes.ts

import { Router } from 'express';
import { createLinkTokenHandler } from '../../controllers/plaid.controller';
// In a future step, we will add an authentication middleware here.

const router = Router();

// Defines the endpoint for POST /api/v1/plaid/create-link-token
router.post('/create-link-token', createLinkTokenHandler);

export default router;
