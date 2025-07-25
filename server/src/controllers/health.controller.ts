// server/src/controllers/health.controller.ts

import { Request, Response, NextFunction } from 'express';
import { checkHealth } from '../services/health.service';
import { DependencyContainer } from '../config/dependencies';
import { supabase } from '../config/supabaseClient';

const container = DependencyContainer.getInstance();

export const getHealthStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Create a check function that uses our repositories
        const checkDbConnection = async () => {
            const { error } = await supabase
                .from('institutions')
                .select('*')
                .limit(1);
            if (error) throw error;
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
