// server/src/controllers/institution.controller.ts

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { DependencyContainer } from '../config/dependencies';
import { getUserInstitutions, archiveInstitution, canLinkAnotherAccount } from '../services/plaid.service';
import { getInstitutionForUser, parseInstitutionId } from '../services/institution.service';
import { NotFoundError } from '../utils/errors';
import { ItemStatus, PlaidItem } from '../repositories/interfaces/plaid-types';

const container = DependencyContainer.getInstance();
const plaidItemRepository = container.getPlaidItemRepository();
const plaidSyncService = container.getPlaidSyncService();
const unitOfWork = container.createUnitOfWork();

/**
 * GET /api/v1/institutions
 * Get all institutions for the authenticated user
 */
export const getInstitutionsHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.id;

        const institutions = await getUserInstitutions(userId, plaidItemRepository);

        res.status(200).json({
            data: institutions,
            count: institutions.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/institutions/:institutionId
 * Archive a linked institution
 */
export const deleteInstitutionHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { institutionId } = req.params;
        const id = parseInstitutionId(institutionId);

        await archiveInstitution(userId, id, plaidItemRepository);

        res.status(200).json({
            message: 'Institution archived successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Helper functions removed - functionality moved to institution.service.ts for better reusability

/**
 * Checks if institution is already syncing and returns appropriate response
 */
const checkSyncStatus = (institution: PlaidItem): boolean => {
    const syncingStatus: ItemStatus = 'syncing';
    return institution.sync_status === syncingStatus;
};

/**
 * POST /api/v1/institutions/:institutionId/refresh
 * Trigger a manual refresh for an institution
 */
export const refreshInstitutionHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { institutionId } = req.params;

        // Validate institution ID and verify ownership in single optimized query
        const id = parseInstitutionId(institutionId);
        const institution = await getInstitutionForUser(id, userId, plaidItemRepository);

        // Check if already syncing
        if (checkSyncStatus(institution)) {
            res.status(200).json({
                message: 'Sync already in progress',
                syncStatus: 'syncing'
            });
            return;
        }

        // Initiate sync using unit of work
        await plaidSyncService.initiateSyncForItem(id, unitOfWork);

        res.status(202).json({
            message: 'Refresh initiated',
            syncStatus: 'syncing'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/institutions/can-link
 * Check if user can link another account
 */
export const canLinkAccountHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.id;
        const maxAccounts = parseInt(req.query.maxAccounts as string) || 10;

        const canLink = await canLinkAnotherAccount(userId, plaidItemRepository, maxAccounts);

        res.status(200).json({
            canLink,
            maxAccounts
        });
    } catch (error) {
        next(error);
    }
};
