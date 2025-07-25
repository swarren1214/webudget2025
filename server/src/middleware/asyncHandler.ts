// server/src/middleware/asyncHandler.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';

const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as any, res, next)).catch(next);
  };
};

export default asyncHandler;
