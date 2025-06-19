// server/src/controllers/health.controller.ts
import { Request, Response } from 'express';
import { checkHealth } from '../services/health.service';

/**
 * Handles the HTTP request for the health check endpoint.
 * It calls the health service and sends the appropriate HTTP response.
 */
export const getHealthStatus = async (req: Request, res: Response) => {
    const healthStatus = await checkHealth();

    // The controller is responsible for request-specific logging.
    if (healthStatus.status === 'OK') {
        req.log.info('Health check successful');
        res.status(200).json(healthStatus);
    } else {
        // Here, we log the error in the context of a failed request.
        req.log.error('Health check failed: Database connection is unavailable.');
        res.status(503).json(healthStatus);
    }
};
