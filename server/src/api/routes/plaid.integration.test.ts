// src/api/routes/plaid.integration.test.ts

import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
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
    const testUserId = 'user-id-123';

    beforeAll(() => {
        app = express();
        app.use(express.json());

        app.use((req: Request, res: Response, next: NextFunction) => {
            req.log = {
                info: jest.fn(), warn: jest.fn(), error: jest.fn(),
                debug: jest.fn(), fatal: jest.fn(), trace: jest.fn(),
                child: jest.fn(),
            } as any;
            req.id = 'test-request-id';
            next();
        });

        app.use(mainRouter);
        app.use(errorHandler);

        const JWT_SECRET = process.env.JWT_SECRET as string;
        validToken = sign({ sub: testUserId }, JWT_SECRET, { expiresIn: '1h' });
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
            .send({ publicToken: 'test-public-token' });

        // --- ASSERT ---
        expect(response.status).toBe(202);
        expect(response.body).toMatchObject({
            id: expect.any(Number),
            plaid_item_id: 'test-item-id',
            institution_name: 'Test Bank',
            user_id: testUserId,
        });
        expect(mockedPlaidClient.itemPublicTokenExchange).toHaveBeenCalledWith({
            public_token: 'test-public-token',
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
