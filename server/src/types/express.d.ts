// server/src/types/express.d.ts
import type { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      log?: any; // or define this as your actual logger type if known
    }
  }
}

export {};