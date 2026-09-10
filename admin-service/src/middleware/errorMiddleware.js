function errorMiddleware(error, req, res, next) {
  console.error("Unhandled server error:", {
    message: error.message,
    stack: error.stack,
    method: req.method,
    path: req.originalUrl,
  });

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message:
      statusCode === 500
        ? "Internal server error"
        : error.message,
  });
}

module.exports = errorMiddleware;