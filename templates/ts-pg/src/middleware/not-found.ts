import { Request, Response } from 'express';

/**
 * Catch-all middleware for unmatched routes.
 *
 * Usage: register after all route modules and before the error handler.
 * Expects any unresolved request path and returns a standardized 404 JSON
 * payload for client-side error handling.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
  });
};
