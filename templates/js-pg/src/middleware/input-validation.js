import { validationResult } from 'express-validator';
import createError from 'http-errors';

/**
 * Converts express-validator chains into middleware with unified 422 handling.
 *
 * Usage: call `validateInputs(rules)` inside route definitions.
 * Expects an array of `ValidationChain` rules and returns middleware that
 * either continues the request or forwards a combined validation error.
 */
export const validateInputs = (inputs) => {
  return [
    ...inputs,
    (req, res, next) => {
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
