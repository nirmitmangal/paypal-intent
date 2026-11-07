import { Request, Response, NextFunction } from 'express';
import { sessionRepository } from '../db/repository';

export function sessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = (req.headers['x-session-token'] as string) || undefined;
  const ipHash = req.ip || undefined;
  const userAgent = req.headers['user-agent'] || undefined;

  const session = sessionRepository.getOrCreate(token, ipHash, userAgent);

  (req as any).session = session;
  (req as any).sessionId = session.id;

  // Set the session token on response header
  res.setHeader('x-session-token', session.sessionToken);

  next();
}
