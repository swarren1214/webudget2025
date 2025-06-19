// server/src/controllers/metrics.controller.ts
import { Request, Response } from 'express';
import register from '../metrics';

/**
 * Handles the HTTP request for the prometheus metrics endpoint.
 */
export const getMetrics = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    req.log.error({ err: error }, 'Failed to generate metrics.');
    res.status(500).send('Error generating metrics');
  }
};
