// server/src/api/routes/connectivity.test.ts

import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mainRouter from './index';
import { errorHandler } from '../../middleware/error.middleware';

describe('Backend Connectivity Tests', () => {
    let app: Express;

    beforeAll(() => {
        app = express();
        
        // Add minimal middleware for testing
        app.use((req: Request, res: Response, next: NextFunction) => {
            req.log = {
                info: jest.fn(), warn: jest.fn(), error: jest.fn(),
                debug: jest.fn(), fatal: jest.fn(), trace: jest.fn(),
                child: jest.fn(),
            } as any;
            req.id = 'test-request-id';
            next();
        });
        
        // Configure CORS the same way as in the main app
        app.use(cors({
            origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
            credentials: true,
            allowedHeaders: [
                'Origin',
                'X-Requested-With', 
                'Content-Type', 
                'Accept',
                'Authorization',
                'Cache-Control',
                'X-Request-Id'
            ],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            optionsSuccessStatus: 200
        }));
        
        app.use(express.json());
        app.use('/', mainRouter);
        app.use(errorHandler);
    });

    describe('CORS Configuration', () => {
        it('should allow preflight requests from frontend origin', async () => {
            const response = await request(app)
                .options('/api/v1/plaid/create-link-token')
                .set('Origin', 'http://localhost:5173')
                .set('Access-Control-Request-Method', 'POST')
                .set('Access-Control-Request-Headers', 'authorization,content-type');

            expect(response.status).toBe(200);
            expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
            expect(response.headers['access-control-allow-credentials']).toBe('true');
            expect(response.headers['access-control-allow-methods']).toContain('POST');
            expect(response.headers['access-control-allow-headers']).toContain('Authorization');
        });

        it('should allow multiple development origins', async () => {
            const origins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
            
            for (const origin of origins) {
                const response = await request(app)
                    .options('/api/v1/plaid/create-link-token')
                    .set('Origin', origin);

                expect(response.status).toBe(200);
                expect(response.headers['access-control-allow-origin']).toBe(origin);
            }
        });
    });

    describe('API Endpoints', () => {
        it('should return 401 for unauthenticated requests to protected endpoints', async () => {
            const response = await request(app)
                .post('/api/v1/plaid/create-link-token')
                .set('Origin', 'http://localhost:5173');

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe('UNAUTHORIZED');
            expect(response.body.error.message).toBe('Authorization header is missing or malformed.');
        });

        it('should have proper API versioning', async () => {
            const response = await request(app)
                .get('/api/v1/')
                .set('Origin', 'http://localhost:5173');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Welcome to the WeBudget API v1');
        });
    });

    describe('Health Check', () => {
        it('should respond to health checks', async () => {
            const response = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:5173');

            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.status).toBeLessThan(600);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
        });
    });
}); 