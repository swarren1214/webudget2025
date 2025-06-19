// server/src/controllers/plaid.controller.ts

import { Request, Response } from 'express';
import { createLinkToken } from '../services/plaid.service';
import plaidClient from '../config/plaid';

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
