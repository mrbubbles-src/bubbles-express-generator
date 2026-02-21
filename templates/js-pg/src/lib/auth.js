import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

/**
 * Hashes plaintext credentials before storing them.
 *
 * Usage: call from registration or password-reset flows.
 * Expects a plaintext password and bcrypt salt rounds; returns the persisted
 * bcrypt hash string.
 */
export const hashPassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
};

/**
 * Compares a login password against the persisted bcrypt hash.
 *
 * Usage: call during authentication before issuing a session token.
 * Expects plaintext input and a stored hash; returns `true` when they match.
 */
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Creates a signed JWT for an authenticated user payload.
 *
 * Usage: call after successful registration/login before setting auth cookies.
 * Expects a JWT payload and optional expiry value; returns a signed token
 * string using the configured app secret.
 */
export const createJWT = (payload, expiresIn = '7d') => {
  const options = {
    expiresIn,
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

/**
 * Verifies and decodes a JWT using the configured app secret.
 *
 * Usage: call in auth middleware before granting protected access.
 * Expects a token string and returns the decoded payload when valid.
 */
export const verifyJWT = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
