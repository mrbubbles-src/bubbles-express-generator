import type { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
  });
};
