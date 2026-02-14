import type { Secret, SignOptions } from 'jsonwebtoken';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import type { JWTPayload } from '../types/types.js';

import { env } from '../config/env.js';

/**
 * Hashes plaintext credentials before persistence.
 *
 * Usage: call during registration or password reset flows.
 */
export const hashPassword = async (password: string, salt: number): Promise<string> => {
  return await bcrypt.hash(password, salt);
};

/**
 * Compares a plaintext password against a stored bcrypt hash.
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Creates signed JWTs for authenticated sessions.
 *
 * Usage: issue short/long lived tokens by overriding `expiresIn`.
 */
export const createJWT = (
  payload: JWTPayload,
  expiresIn: SignOptions['expiresIn'] = '7d',
): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET as Secret, options);
};

/**
 * Verifies and decodes a JWT using the configured application secret.
 */
export const verifyJWT = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_SECRET as Secret) as JWTPayload;
};
