// src/index.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { httpRequestDurationSeconds, httpRequestsTotal } from './metrics';
import logger from './logger';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import mainRouter from './api/routes';
import { errorHandler } from './middleware/error.middleware';
import dotenv from 'dotenv';
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

// --- API Routes ---
app.use('/', mainRouter);

// IMPORTANT: Error handler must be the LAST middleware
app.use(errorHandler);

// --- Start the Server ---
app.listen(port, () => {
  logger.info(`[server]: Server is running at http://localhost:${port}`);
});
