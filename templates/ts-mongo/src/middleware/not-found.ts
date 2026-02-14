import type { Request, Response } from 'express';

/**
 * Catch-all handler for unmatched routes.
 *
 * Usage: register after all route modules and before the error handler.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
  });
};
