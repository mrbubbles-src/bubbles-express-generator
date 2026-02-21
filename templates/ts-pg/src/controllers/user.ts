import type { NextFunction, Request, Response } from 'express';

import { eq, or } from 'drizzle-orm';

import type { GlobalError, JWTPayload } from '../types/types.js';

import { db } from '../db/index.js';
import { usersTable } from '../db/schema.js';
import { comparePassword, createJWT, hashPassword } from '../lib/auth.js';

/**
 * Returns cookie options used when issuing auth tokens.
 *
 * Usage: pass this object to `res.cookie(...)` in auth handlers.
 * Expects `NODE_ENV` to determine secure-cookie behavior and returns a stable
 * options object shared by register and login flows.
 */
const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

/**
 * Creates a user account, issues a JWT cookie, and sends the API response.
 *
 * Usage: mount on `POST /users/register` after validation middleware.
 * Expects validated `username`, `email`, and `password` fields in `req.body`;
 * returns via HTTP response on success or `next(error)` on failure.
 */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;

    const user = await db
      .select()
      .from(usersTable)
      .where(or(eq(usersTable.username, username), eq(usersTable.email, email)));

    if (user.length > 0) {
      const error: GlobalError = new Error('Username or email already exists');
      error.statusCode = 400;
      return next(error);
    }
    const hashedPassword = await hashPassword(password, 16);
    const newUser = await db
      .insert(usersTable)
      .values({ username, email, password: hashedPassword })
      .returning({
        id: usersTable.id,
        username: usersTable.username,
        verified: usersTable.verified,
        role: usersTable.role,
      });

    if (newUser.length === 0) {
      const error: GlobalError = new Error('Failed to create user');
      error.statusCode = 500;
      return next(error);
    }

    const token = createJWT(newUser[0] as JWTPayload, '30d');

    res.cookie('token', token, getAuthCookieOptions());

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Authenticates credentials, rotates the auth cookie, and returns login state.
 *
 * Usage: mount on `POST /users/login` with rate limiting and validation.
 * Expects validated `email` and `password` in `req.body`; returns via HTTP
 * response on success or `next(error)` when authentication fails.
 */
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        role: usersTable.role,
        verified: usersTable.verified,
        password: usersTable.password,
      })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (user.length === 0) {
      const error: GlobalError = new Error('Invalid email or password');
      error.statusCode = 401;
      return next(error);
    }

    const isPasswordValid = await comparePassword(password, user[0].password);

    if (!isPasswordValid) {
      const error: GlobalError = new Error('Invalid email or password');
      error.statusCode = 401;
      return next(error);
    }

    const { id, username, role, verified } = user[0];

    const token = createJWT({ id, username, role, verified } as JWTPayload, '30d');

    res.cookie('token', token, getAuthCookieOptions());

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    return next(error);
  }
};
