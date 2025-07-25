// src/api/routes/plaid.integration.test.ts

import request from 'supertest';
import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import { sign } from 'jsonwebtoken';
import { mocked } from 'jest-mock';
import { ItemGetResponse, ItemPublicTokenExchangeResponse, InstitutionsGetByIdResponse } from 'plaid';
import { AxiosResponse } from 'axios';

// Import the actual database pool to set up test data
import pool from '../../config/database';
import plaidClient from '../../config/plaid';
import mainRouter from './index';
import { errorHandler } from '../../middleware/error.middleware';

jest.mock('../../config/plaid');

const mockedPlaidClient = mocked(plaidClient);

describe('Plaid Integration Tests: POST /api/v1/plaid/exchange-public-token', () => {
    let app: Express;
    let validToken: string;
    const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID format

    beforeAll(() => {
        app = express();
        app.use(express.json());

        // Adjust middleware to ensure compatibility with typings
        app.use(((req: Request, res: Response, next: NextFunction) => {
            req.log = req.log ?? {
                info: jest.fn() as jest.Mock<any, any>,
                warn: jest.fn() as jest.Mock<any, any>,
                error: jest.fn() as jest.Mock<any, any>,
                debug: jest.fn() as jest.Mock<any, any>,
                fatal: jest.fn() as jest.Mock<any, any>,
                trace: jest.fn() as jest.Mock<any, any>,
                child: jest.fn() as jest.Mock<any, any>,
            };
            req.id = req.id ?? 'test-request-id';
            next();
        }) as unknown as RequestHandler);

        app.use(mainRouter);
        app.use(errorHandler);

        const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET as string;
        validToken = sign({ sub: testUserId }, SUPABASE_JWT_SECRET, { expiresIn: '1h' });
    });

    // This block runs before each test to ensure the user exists
    beforeEach(async () => {
        await pool.query(
            "INSERT INTO users (id, email, full_name) VALUES ($1, 'test@example.com', 'Test User') ON CONFLICT (id) DO NOTHING",
            [testUserId]
        );
    });

    // This block runs after each test to clean up the database
    afterEach(async () => {
        await pool.query("DELETE FROM plaid_items WHERE user_id = $1", [testUserId]);
        await pool.query("DELETE FROM users WHERE id = $1", [testUserId]);
    });

    // This ensures the database connection pool is closed after all tests run
    afterAll(async () => {
        await pool.end();
    });

    it('should return 202 Accepted and the new institution on successful token exchange', async () => {
        // --- ARRANGE ---
        const mockExchangeResponse: AxiosResponse<ItemPublicTokenExchangeResponse> = {
            data: { access_token: 'test-access-token', item_id: 'test-item-id', request_id: 'req_123' },
            status: 200, statusText: 'OK', headers: {}, config: {} as any
        };
        const mockItemGetResponse: AxiosResponse<ItemGetResponse> = {
            data: { item: { institution_id: 'ins_123' } as any, request_id: 'req_456' },
            status: 200, statusText: 'OK', headers: {}, config: {} as any
        };
        const mockInstitutionGetResponse: AxiosResponse<InstitutionsGetByIdResponse> = {
            data: { institution: { name: 'Test Bank' } as any, request_id: 'req_789' },
            status: 200, statusText: 'OK', headers: {}, config: {} as any
        };

        mockedPlaidClient.itemPublicTokenExchange.mockResolvedValue(mockExchangeResponse);
        mockedPlaidClient.itemGet.mockResolvedValue(mockItemGetResponse);
        mockedPlaidClient.institutionsGetById.mockResolvedValue(mockInstitutionGetResponse);

        // --- ACT ---
        const response = await request(app)
            .post('/api/v1/plaid/exchange-public-token')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ publicToken: 'public-test-token-123456789' });

        // --- ASSERT ---
        expect(response.status).toBe(202);
        expect(response.body).toMatchObject({
            id: expect.any(Number),
            plaid_item_id: 'test-item-id',
            institution_name: 'Test Bank',
            user_id: testUserId,
        });
        expect(mockedPlaidClient.itemPublicTokenExchange).toHaveBeenCalledWith({
            public_token: 'public-test-token-123456789',
        });
    });

    it('should return 401 Unauthorized if no auth token is provided', async () => {
        const response = await request(app)
            .post('/api/v1/plaid/exchange-public-token')
            .send({ publicToken: 'test-public-token' });

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
        expect(mockedPlaidClient.itemPublicTokenExchange).not.toHaveBeenCalled();
    });
});
