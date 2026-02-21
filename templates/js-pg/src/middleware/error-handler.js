/**
 * Final error middleware that normalizes failures into JSON API responses.
 *
 * Usage: register this last in the middleware chain.
 * Expects an error object (optionally with `statusCode`) and returns a JSON
 * response while logging server-side failures for observability.
 */
export const errorHandler = (err, req, res, next) => {
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
