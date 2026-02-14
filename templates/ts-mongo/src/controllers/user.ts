import type { NextFunction, Request, Response } from 'express';

import type { GlobalError, JWTPayload } from '../types/types.js';

import { comparePassword, createJWT, hashPassword } from '../lib/auth.js';
import User from '../models/user.js';

/**
 * Shared cookie policy for auth tokens issued by login/register routes.
 *
 * Usage: keeps cookie behavior consistent between auth endpoints.
 */
const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

/**
 * Registers a new account and signs the user in with a fresh token cookie.
 *
 * Usage: mounted on `POST /users/register` after validation middleware.
 */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      const error: GlobalError = new Error('Username or email already exists');
      error.statusCode = 400;
      return next(error);
    }

    const hashedPassword = await hashPassword(password, 16);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = createJWT(
      {
        _id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        verified: newUser.verified,
      } as JWTPayload,
      '30d',
    );

    res.cookie('token', token, getAuthCookieOptions());

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Authenticates a user and rotates the auth cookie on successful login.
 *
 * Usage: mounted on `POST /users/login` with rate limiting + validation.
 */
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      const error: GlobalError = new Error('Invalid email or password');
      error.statusCode = 401;
      return next(error);
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      const error: GlobalError = new Error('Invalid email or password');
      error.statusCode = 401;
      return next(error);
    }

    const { _id, username, role, verified } = user;

    const token = createJWT({ _id: _id, username, role, verified } as JWTPayload, '30d');

    res.cookie('token', token, getAuthCookieOptions());

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    return next(error);
  }
};
