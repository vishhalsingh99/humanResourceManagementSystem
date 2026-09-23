import { ApiError } from '../utils/ApiError.js';

// Validates req[source] against a zod schema. On success, req[source] is replaced
// with the parsed (and any zod-transformed/coerced) data. On failure, forwards an
// ApiError(400, "field: message, field2: message2") so the shared errorHandler
// renders the same `{ error }` shape the frontend already expects from the old
// hand-rolled validator.
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});

  if (!result.success) {
    const messages = [...new Set(result.error.issues.map((issue) => issue.message))];
    return next(new ApiError(400, messages.join(', ')));
  }

  if (source === 'query') {
    // Express 5's req.query is a prototype getter that recomputes from the
    // URL on every access (nothing is cached on the instance), so neither
    // reassignment nor in-place mutation of a previously-read req.query
    // object has any effect on later reads. Shadow it with an own property
    // on this request instance instead.
    Object.defineProperty(req, 'query', {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } else {
    req[source] = result.data;
  }

  next();
};

export { validate };
