// src/index.ts
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiV1Router from './api/routes';
import pool from './config/database';

// Load environment variables from .env file
dotenv.config();

// Initialize the Express application
const app: Express = express();
const port = process.env.PORT || 3000;

// --- Global Middleware ---
// Enable Cross-Origin Resource Sharing
app.use(cors());
// Enable JSON body parsing
app.use(express.json());

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
    res.status(200).json(healthCheck);
  } catch (error) {
    // Log the actual error for debugging
    console.error('Health check failed:', error);

    healthCheck.status = 'UNAVAILABLE';
    healthCheck.dependencies.database = 'UNAVAILABLE';
    res.status(503).json(healthCheck);
  }
});

app.use('/api/v1', apiV1Router);

// --- Start the Server ---
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});