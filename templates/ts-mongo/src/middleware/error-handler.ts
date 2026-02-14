import type { NextFunction, Request, Response } from 'express';

import type { GlobalError } from '../types/types.js';

/**
 * Final error middleware that converts internal errors into API responses.
 *
 * Usage: register last so route/middleware errors consistently map to JSON.
 */
export const errorHandler = (
  err: GlobalError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || 'Internal server error';

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    statusCode,
    message,
  });
};
