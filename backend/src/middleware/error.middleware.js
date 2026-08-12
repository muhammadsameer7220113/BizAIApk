exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';
  res.status(status).json({
    success: false,
    error: { code, message, ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}) }
  });
};

exports.ApiError = class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
};
