/**
 * Small typed error you can `throw` from controllers/services to control the
 * HTTP status code returned by the centralized handler below.
 */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(req, res, next) {
  next(new ApiError(404, `Route non trouvée : ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json({ error: err.message || "Erreur interne du serveur" });
}

// Wraps an async controller so rejected promises are forwarded to errorHandler
// instead of crashing the process / hanging the request.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { ApiError, notFound, errorHandler, asyncHandler };
