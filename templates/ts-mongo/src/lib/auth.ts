import { JWTPayload } from '../types/types.js';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export const hashPassword = async (
  password: string,
  salt: number,
): Promise<string> => {
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const createJWT = (
  payload: JWTPayload,
  expiresIn: SignOptions['expiresIn'] = '7d',
): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET as Secret, options);
};

export const verifyJWT = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_SECRET as Secret) as JWTPayload;
};
