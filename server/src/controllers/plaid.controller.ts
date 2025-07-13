// server/src/controllers/plaid.controller.ts

import { Response, NextFunction } from 'express';
import { createLinkToken, exchangePublicToken } from '../services/plaid.service';
import { DependencyContainer } from '../config/dependencies';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth.middleware';

// Get dependencies from the container
const container = DependencyContainer.getInstance();
const plaidItemRepository = container.getPlaidItemRepository();
const plaidWrappers = container.getPlaidClientWrappers();
const { encrypt } = container.getCryptoUtils();

export const createLinkTokenHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedError('User not authenticated');
        }

        const tokenData = await createLinkToken(
            userId,
            plaidWrappers.linkTokenCreate
        );

        res.status(200).json(tokenData);
    } catch (error) {
        next(error);
    }
};

export const exchangePublicTokenHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedError('User not authenticated');
        }

        const { publicToken } = req.body;
        if (!publicToken) {
            throw new ValidationError('publicToken is required');
        }

        const newItem = await exchangePublicToken(
            plaidWrappers.itemPublicTokenExchange,
            plaidWrappers.itemGet,
            plaidWrappers.institutionsGetById,
            encrypt,
            plaidItemRepository,
            userId,
            publicToken
        );

        res.status(202).json(newItem);
    } catch (error) {
        next(error);
    }
};
