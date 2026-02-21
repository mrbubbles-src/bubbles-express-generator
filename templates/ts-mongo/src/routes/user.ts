import express from 'express';

import { createUser, verifyUser } from '../controllers/user.js';
import { userValidationRules } from '../lib/auth-rules.js';
import { authRateLimit } from '../middleware/auth-rate-limit.js';
import { validateInputs } from '../middleware/input-validation.js';
import { verifyUserToken } from '../middleware/verify-user-token.js';

/**
 * Router wiring for user-auth endpoints under the `/users` namespace.
 *
 * Usage: mount this router under `/users` during app setup.
 * Expects auth middleware and controller handlers; returns an Express router.
 */
export const router = express.Router();

router
  .route('/register')
  .post(authRateLimit, validateInputs(userValidationRules.register), createUser);
router
  .route('/login')
  .post(authRateLimit, verifyUserToken, validateInputs(userValidationRules.login), verifyUser);
