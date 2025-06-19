// src/index.ts
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiV1Router from './api/routes';
import pool from './config/database';
import { httpRequestDurationSeconds, httpRequestsTotal } from './metrics';
import register from './metrics';
import logger from './logger';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';

// Load environment variables from .env file
dotenv.config();

// Initialize the Express application
const app: Express = express();
const port = process.env.PORT || 3000;

app.use(pinoHttp({
  logger,
  // Define a custom request ID header
  genReqId: function (req, res) {
    const existingId = req.id ?? req.headers["x-request-id"];
    if (existingId) return existingId;
    const id = randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
}));

// --- Global Middleware ---
// Enable Cross-Origin Resource Sharing
app.use(cors());
// Enable JSON body parsing
app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDurationSeconds.startTimer();

  res.on('finish', () => {
    const route = req.route ? req.route.path : req.originalUrl.split('?')[0];

    const labels = {
      method: req.method,
      route: route,
      code: res.statusCode.toString()
    };

    end(labels); // Record the duration
    httpRequestsTotal.inc(labels); // Increment the counter
  });

  next();
});

// --- Health Check Endpoint ---
app.get('/health', async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    dependencies: {
      database: 'OK',
    },
  };

  try {
    // The 'pg' library's pool.query method is efficient.
    // It will check out a client, run the query, and release it automatically.
    await pool.query('SELECT 1');
    req.log.info('Health check successful');
    res.status(200).json(healthCheck);
  } catch (error) {
    // Log the actual error for debugging
    req.log.error({ err: error }, 'Health check failed due to database error.');

    healthCheck.status = 'UNAVAILABLE';
    healthCheck.dependencies.database = 'UNAVAILABLE';
    res.status(503).json(healthCheck);
  }
});

app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/v1', apiV1Router);

// --- Start the Server ---
app.listen(port, () => {
  logger.info(`[server]: Server is running at http://localhost:${port}`);
});