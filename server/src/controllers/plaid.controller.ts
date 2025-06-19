// server/src/controllers/plaid.controller.ts

import { Request, Response } from 'express';
import { createLinkToken } from '../services/plaid.service';
import plaidClient from '../config/plaid';
import { exchangePublicToken } from '../services/plaid.service';
import { encrypt } from '../utils/crypto';
import dbPool from '../config/database';
import { createPlaidItem } from '../repositories/plaid.repository';

interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

export const createLinkTokenHandler = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Assume auth middleware has run and attached the user.
        // We add a check here to ensure the user object exists.
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // 2. Inject the concrete Plaid client method into our service.
        // We use .bind() to ensure the method retains its correct 'this' context from the plaidClient instance.
        const tokenData = await createLinkToken(userId, plaidClient.linkTokenCreate.bind(plaidClient));

        res.status(200).json(tokenData);
    } catch (error) {
        // Log the error and send a generic server error response.
        req.log.error({ err: error }, 'Failed to create Plaid link token.');
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const exchangePublicTokenHandler = async (req: AuthRequest, res: Response, next: Function) => {
    try {
        const userId = req.user?.id;
        const { publicToken } = req.body;

        if (!userId) {
            // This case should be handled by authMiddleware, but it's good practice to be safe.
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!publicToken) {
            return res.status(400).json({ error: 'publicToken is required' });
        }

        const newItem = await exchangePublicToken(
            dbPool,
            plaidClient.itemPublicTokenExchange.bind(plaidClient),
            plaidClient.institutionsGetById.bind(plaidClient),
            encrypt,
            createPlaidItem,
            userId,
            publicToken
        );

        // As per the API spec, return 202 Accepted with the new item.
        res.status(202).json(newItem);

    } catch (error) {
        // Pass any errors to the next error-handling middleware.
        next(error);
    }
};
