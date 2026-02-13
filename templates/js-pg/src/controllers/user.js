import { usersTable } from '../db/schema.js';
import { db } from '../db/index.js';
import { eq, or } from 'drizzle-orm';
import { comparePassword, createJWT, hashPassword } from '../lib/auth.js';

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

export const createUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const user = await db
      .select()
      .from(usersTable)
      .where(
        or(eq(usersTable.username, username), eq(usersTable.email, email)),
      );

    if (user.length > 0) {
      const error = new Error('Username or email already exists');
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
      const error = new Error('Failed to create user');
      error.statusCode = 500;
      return next(error);
    }

    const token = createJWT(newUser[0], '30d');

    res.cookie('token', token, getAuthCookieOptions());

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    return next(error);
  }
};

export const verifyUser = async (req, res, next) => {
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
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      return next(error);
    }

    const isPasswordValid = await comparePassword(password, user[0].password);

    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      return next(error);
    }

    const { id, username, role, verified } = user[0];

    const token = createJWT({ id, username, role, verified }, '30d');

    res.cookie('token', token, getAuthCookieOptions());

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    return next(error);
  }
};
