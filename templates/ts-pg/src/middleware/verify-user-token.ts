import { verifyJWT } from '../lib/auth.js';
import { Request, Response, NextFunction } from 'express';

/**
 * Blocks login/register calls when a valid auth cookie already exists.
 *
 * Usage: place before login/register handlers to prevent duplicate sessions.
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
