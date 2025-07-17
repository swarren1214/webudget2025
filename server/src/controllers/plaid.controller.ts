// server/src/controllers/plaid.controller.ts

import { Response, NextFunction } from 'express';
import { 
    createLinkToken, 
    exchangePublicToken,
    PlaidTokenExchangeContext,
    ExchangeTokenRequest
} from '../services/plaid.service';
import { DependencyContainer } from '../config/dependencies';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth.middleware';
import { RepositoryFactory } from '../repositories/repository.factory';
import pool from '../config/database';
import logger from '../logger';

// Get dependencies from the container
const container = DependencyContainer.getInstance();
const plaidWrappers = container.getPlaidClientWrappers();
const { encrypt } = container.getCryptoUtils();
const unitOfWork = container.createUnitOfWork();

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

        // Ensure the user exists in the users table
        const userExistsQuery = 'SELECT 1 FROM users WHERE supabase_user_id = $1';
        const { rowCount } = await pool.query(userExistsQuery, [userId]);

        if (rowCount === 0) {
            throw new ValidationError('User does not exist in the database');
        }

        const context: PlaidTokenExchangeContext = {
            plaidExchangeToken: plaidWrappers.itemPublicTokenExchange,
            plaidItemGet: plaidWrappers.itemGet,
            plaidGetInstitution: plaidWrappers.institutionsGetById,
            encrypt,
            unitOfWork,
        };

        const request: ExchangeTokenRequest = {
            userId,
            publicToken,
        };

        const newItem = await exchangePublicToken(context, request);

        res.status(202).json(newItem);
    } catch (error) {
        logger.error('Error in exchangePublicTokenHandler', {
            error: (error as any).message,
            stack: (error as any).stack,
            requestId: req.id,
            userId: req.user?.id,
        });
        next(error);
    }
};
