import { verifyJWT } from '../lib/auth.js';

/**
 * Blocks login/register calls when a valid auth cookie already exists.
 *
 * Usage: place before login/register handlers to prevent duplicate sessions.
 */
export const verifyUserToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return next();
  }
  try {
    verifyJWT(token);
    return res.status(409).json({ message: 'Already authenticated' });
  } catch {
    res.clearCookie('token');
    return next();
  }
};
