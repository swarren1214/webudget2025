// server/src/api/routes/institution.routes.ts

import { Router } from 'express';
import {
    getInstitutionsHandler,
    deleteInstitutionHandler,
    refreshInstitutionHandler,
    canLinkAccountHandler
} from '../../controllers/institution.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get(
    '/',
    asyncHandler(getInstitutionsHandler)
);

router.get(
    '/can-link',
    asyncHandler(canLinkAccountHandler)
);

router.delete(
    '/:institutionId',
    asyncHandler(deleteInstitutionHandler)
);

router.post(
    '/:institutionId/refresh',
    asyncHandler(refreshInstitutionHandler)
);

export default router;
