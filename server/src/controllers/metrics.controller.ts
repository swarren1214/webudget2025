// server/src/controllers/metrics.controller.ts
import { Request, Response, NextFunction } from 'express';
import register from '../metrics';

export const getMetrics = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (error) {
        next(error);
    }
};
