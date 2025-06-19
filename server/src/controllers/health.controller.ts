// server/src/controllers/health.controller.ts

import { Request, Response } from 'express';
import { checkHealth } from '../services/health.service';
import { checkConnection } from '../config/database';

/**
 * Handles the HTTP request for the health check endpoint.
 */
export const getHealthStatus = async (req: Request, res: Response) => {
    const healthStatus = await checkHealth(checkConnection);

    if (healthStatus.status === 'OK') {
        res.status(200).json(healthStatus);
    } else {
        res.status(503).json(healthStatus);
    }
};
