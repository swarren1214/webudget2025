// server/src/controllers/health.controller.ts

import { Request, Response, NextFunction } from 'express';
import { checkHealth } from '../services/health.service';
import { DependencyContainer } from '../config/dependencies';

const container = DependencyContainer.getInstance();

export const getHealthStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Create a check function that uses our repositories
        const checkDbConnection = async () => {
            const repository = container.getPlaidItemRepository();
            // Simple query to verify connection
            await repository.findById(-1); // Won't find anything, but tests connection
        };

        const healthStatus = await checkHealth(checkDbConnection);

        if (healthStatus.status === 'OK') {
            res.status(200).json(healthStatus);
        } else {
            res.status(503).json(healthStatus);
        }
    } catch (error) {
        next(error);
    }
};
