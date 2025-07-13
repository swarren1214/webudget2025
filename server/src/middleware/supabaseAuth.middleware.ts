import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Make sure to set SUPABASE_JWT_SECRET in your environment variables
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;

export function supabaseAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, SUPABASE_JWT_SECRET);
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

