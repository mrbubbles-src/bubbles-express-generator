import { verifyJWT } from '../lib/auth.js';

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
