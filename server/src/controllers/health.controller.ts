// server/src/controllers/health.controller.ts

import { Request, Response } from 'express';
import { checkHealth } from '../services/health.service';

/**
 * Handles the HTTP request for the health check endpoint.
 * It calls the health service and sends the appropriate HTTP response.
 */
export const getHealthStatus = async (req: Request, res: Response) => {
    const healthStatus = await checkHealth();

    if (healthStatus.status === 'OK') {
        res.status(200).json(healthStatus);
    } else {
        res.status(503).json(healthStatus);
    }
};
