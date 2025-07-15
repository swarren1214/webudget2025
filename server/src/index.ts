// src/index.ts
import config from './config/env'; // This MUST be the first import
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { httpRequestDurationSeconds, httpRequestsTotal } from './metrics';
import logger from './logger';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import mainRouter from './api/routes';
import { errorHandler } from './middleware/error.middleware';
import { ConfigurationError } from './utils/errors';

// Handle configuration errors gracefully
process.on('uncaughtException', (error) => {
    if (error instanceof ConfigurationError) {
        console.error('FATAL_ERROR: Configuration validation failed');
        console.error(error.message);
        if (error.details?.message) {
            console.error(error.details.message);
        }
        process.exit(1);
    }
    // Re-throw other uncaught exceptions
    throw error;
});

// Initialize the Express application
const app: Express = express();
const port = config.PORT;

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
// Enable Cross-Origin Resource Sharing with development-specific configuration
app.use(cors({
  origin: config.NODE_ENV === 'development' 
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175', 'http://127.0.0.1:3000']
    : true, // In production, configure this more restrictively
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
  optionsSuccessStatus: 200 // For legacy browser support
}));

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
