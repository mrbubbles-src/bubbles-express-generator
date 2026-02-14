/**
 * Final error middleware that converts internal errors into API responses.
 *
 * Usage: register last so route/middleware errors consistently map to JSON.
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
