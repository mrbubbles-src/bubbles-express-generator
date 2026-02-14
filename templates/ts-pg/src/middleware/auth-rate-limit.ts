import rateLimit from 'express-rate-limit';

/**
 * Rate limit tuned for authentication endpoints to slow brute-force attempts.
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
