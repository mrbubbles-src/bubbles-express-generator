import { NextFunction, Request, Response } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import createError from 'http-errors';

/**
 * Combines express-validator chains with a unified 422 error response path.
 *
 * Usage: `validateInputs(rules)` returns middleware ready for route wiring.
 */
export const validateInputs = (inputs: ValidationChain[]) => {
  return [
    ...inputs,
    (req: Request, _res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }
      const validationErrors = errors.array().map((error) => error.msg);
      const error = createError(422, validationErrors.join(', '));

      return next(error);
    },
  ];
};
