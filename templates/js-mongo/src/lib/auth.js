import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

/**
 * Hashes plaintext credentials before persistence.
 *
 * Usage: call during registration or password reset flows.
 */
export const hashPassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
};

/**
 * Compares a plaintext password against a stored bcrypt hash.
 */
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Creates signed JWTs for authenticated sessions.
 *
 * Usage: issue short/long lived tokens by overriding `expiresIn`.
 */
export const createJWT = (payload, expiresIn = '7d') => {
  const options = {
    expiresIn,
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

/**
 * Verifies and decodes a JWT using the configured application secret.
 */
export const verifyJWT = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
