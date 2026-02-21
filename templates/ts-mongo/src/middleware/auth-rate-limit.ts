import rateLimit from 'express-rate-limit';

/**
 * Authentication throttle middleware that slows brute-force login attempts.
 *
 * Usage: attach before login/register handlers on `/users` routes.
 * Expects repeated requests from the same client and returns standard
 * Express middleware that emits 429 responses after the limit is exceeded.
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: 'Too many authentication attempts, please try again later.',
  },
});
