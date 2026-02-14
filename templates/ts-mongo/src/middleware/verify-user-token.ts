import type { NextFunction, Request, Response } from 'express';

import { verifyJWT } from '../lib/auth.js';

/**
 * Blocks login/register calls when a valid auth cookie already exists.
 *
 * Usage: place before login/register handlers to prevent duplicate sessions.
 */
export const verifyUserToken = (req: Request, res: Response, next: NextFunction): void => {
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
