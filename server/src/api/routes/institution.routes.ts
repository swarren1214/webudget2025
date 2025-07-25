// server/src/api/routes/institution.routes.ts

import { Router, RequestHandler } from 'express';
import {
    getInstitutionsHandler,
    deleteInstitutionHandler,
    refreshInstitutionHandler,
    canLinkAccountHandler
} from '../../controllers/institution.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { AuthRequest } from '@/types/auth';

const router = Router();

// Adjust middleware to ensure compatibility with typings
router.use(((req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    authMiddleware(authReq, res, next);
}) as RequestHandler);

// Wrap handlers in properly typed RequestHandler
const getInstitutionsHandlerWrapper: RequestHandler = async (req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    await getInstitutionsHandler(authReq, res, next);
};

const deleteInstitutionHandlerWrapper: RequestHandler = async (req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    await deleteInstitutionHandler(authReq, res, next);
};

const refreshInstitutionHandlerWrapper: RequestHandler = async (req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    await refreshInstitutionHandler(authReq, res, next);
};

const canLinkAccountHandlerWrapper: RequestHandler = async (req, res, next) => {
    const authReq = req as unknown as AuthRequest;
    await canLinkAccountHandler(authReq, res, next);
};

// Adjust asyncHandler usage to resolve type compatibility issues
const asyncHandlerWrapper = (handler: RequestHandler): RequestHandler => {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};

// Replace route handlers with properly wrapped handlers
router.get(
    '/',
    asyncHandlerWrapper(getInstitutionsHandlerWrapper)
);

router.get(
    '/can-link',
    asyncHandlerWrapper(canLinkAccountHandlerWrapper)
);

router.delete(
    '/:institutionId',
    asyncHandlerWrapper(deleteInstitutionHandlerWrapper)
);

router.post(
    '/:institutionId/refresh',
    asyncHandlerWrapper(refreshInstitutionHandlerWrapper)
);

export default router;
