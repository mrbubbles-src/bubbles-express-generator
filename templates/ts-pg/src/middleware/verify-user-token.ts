import { verifyJWT } from '../lib/auth.js';
import { Request, Response, NextFunction } from 'express';

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
