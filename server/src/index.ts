// src/index.ts
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiV1Router from './api/routes';

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
// A simple endpoint to confirm the server is running
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/v1', apiV1Router);

// --- Start the Server ---
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});