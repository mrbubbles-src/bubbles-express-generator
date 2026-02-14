export const notFoundHandler = (req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
  });
};
