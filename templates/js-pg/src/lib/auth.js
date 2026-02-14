import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

export const hashPassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const createJWT = (payload, expiresIn = '7d') => {
  const options = {
    expiresIn,
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyJWT = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
