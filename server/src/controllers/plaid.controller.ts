// server/src/controllers/plaid.controller.ts

import { Request, Response, NextFunction } from 'express';
import { createLinkToken, exchangePublicToken } from '../services/plaid.service';
import plaidClient from '../config/plaid';
import { encrypt } from '../utils/crypto';
import dbPool from '../config/database';
import { createPlaidItem } from '../repositories/plaid.repository';
import { UnauthorizedError, ValidationError } from '../utils/errors';

interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

export const createLinkTokenHandler = async (
    req: AuthRequest, 
    res: Response, 
    next: NextFunction
): Promise<void> => {
    try {
        // Throw errors instead of manually sending responses
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedError('User not authenticated');
        }

        const tokenData = await createLinkToken(
            userId, 
            plaidClient.linkTokenCreate.bind(plaidClient)
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
            dbPool,
            plaidClient.itemPublicTokenExchange.bind(plaidClient),
            plaidClient.itemGet.bind(plaidClient), // Add this line
            plaidClient.institutionsGetById.bind(plaidClient),
            encrypt,
            createPlaidItem,
            userId,
            publicToken
        );

        res.status(202).json(newItem);
    } catch (error) {
        next(error);
    }
};
