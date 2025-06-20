// server/src/controllers/plaid.controller.ts

import { Request, Response, NextFunction } from 'express';
import { createLinkToken, exchangePublicToken } from '../services/plaid.service';
import plaidClient from '../config/plaid';
import { encrypt } from '../utils/crypto';
import dbPool from '../config/database';
import { getRepositoryFactory } from '../repositories/repository.factory';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth.middleware';
import {
    LinkTokenCreateRequest,
    LinkTokenCreateResponse,
    ItemPublicTokenExchangeRequest,
    ItemPublicTokenExchangeResponse,
    ItemGetRequest,
    ItemGetResponse,
    InstitutionsGetByIdRequest,
    InstitutionsGetByIdResponse
} from 'plaid';

// Create wrapper functions that extract the data from Axios responses
const plaidLinkTokenCreate = async (request: LinkTokenCreateRequest): Promise<LinkTokenCreateResponse> => {
    const response = await plaidClient.linkTokenCreate(request);
    return response.data;
};

const plaidItemPublicTokenExchange = async (request: ItemPublicTokenExchangeRequest): Promise<ItemPublicTokenExchangeResponse> => {
    const response = await plaidClient.itemPublicTokenExchange(request);
    return response.data;
};

const plaidItemGet = async (request: ItemGetRequest): Promise<ItemGetResponse> => {
    const response = await plaidClient.itemGet(request);
    return response.data;
};

const plaidInstitutionsGetById = async (request: InstitutionsGetByIdRequest): Promise<InstitutionsGetByIdResponse> => {
    const response = await plaidClient.institutionsGetById(request);
    return response.data;
};

// Get the repository factory and create repository instances
const repositoryFactory = getRepositoryFactory(dbPool);
const plaidItemRepository = repositoryFactory.getPlaidItemRepository();

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
            plaidLinkTokenCreate
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
            plaidItemPublicTokenExchange,
            plaidItemGet,
            plaidInstitutionsGetById,
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
