import { verifyJWT } from '../lib/auth.js';
import { Request, Response, NextFunction } from 'express';

/**
 * Blocks auth endpoints when a valid auth cookie is already present.
 *
 * Usage: place before login/register handlers to prevent duplicate sessions.
 * Expects the auth token in `req.cookies.token`; returns a 409 response for
 * valid tokens, otherwise clears invalid cookies and delegates to `next()`.
 */
export const verifyUserToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.cookies?.token;
  if (!token) {
    return next();
  }
  try {
    verifyJWT(token);
    res.status(409).json({ message: 'Already authenticated' });
    return;
  } catch {
    res.clearCookie('token');
    next();
    return;
  }
};
