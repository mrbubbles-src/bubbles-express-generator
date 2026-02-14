import express from 'express';
import { createUser, verifyUser } from '../controllers/user.js';
import { verifyUserToken } from '../middleware/verify-user-token.js';
import { userValidationRules } from '../lib/auth-rules.js';
import { validateInputs } from '../middleware/input-validation.js';
import { authRateLimit } from '../middleware/auth-rate-limit.js';

export const router = express.Router();

router
  .route('/register')
  .post(authRateLimit, validateInputs(userValidationRules.register), createUser);
router
  .route('/login')
  .post(
    authRateLimit,
    verifyUserToken,
    validateInputs(userValidationRules.login),
    verifyUser,
  );
