// Thrown by services/controllers for expected failure cases (bad input, not found,
// duplicate record, etc). Caught centrally by middlewares/errorHandler.js, which
// renders it as `{ error: message, ...details }` -- the response shape the
// frontend already expects, so this class intentionally does not introduce a new
// envelope (no `{ success, data }` wrapper).
class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export { ApiError };
