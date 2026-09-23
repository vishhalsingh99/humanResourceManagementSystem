// Rate limiting middleware
const rateLimit = {};

const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100, // max requests per window
    message = 'Too many requests from this IP, please try again later.'
  } = options;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Initialize or clean up old entries
    if (!rateLimit[ip]) {
      rateLimit[ip] = { count: 0, resetTime: now + windowMs };
    }

    // Check if window has expired
    if (now > rateLimit[ip].resetTime) {
      rateLimit[ip] = { count: 0, resetTime: now + windowMs };
    }

    // Increment request count
    rateLimit[ip].count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - rateLimit[ip].count));
    res.setHeader('X-RateLimit-Reset', rateLimit[ip].resetTime);

    // Check if limit exceeded
    if (rateLimit[ip].count > maxRequests) {
      return res.status(429).json({ error: message });
    }

    next();
  };
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const ip in rateLimit) {
    if (now > rateLimit[ip].resetTime) {
      delete rateLimit[ip];
    }
  }
}, 60 * 60 * 1000); // Clean every hour

export { rateLimiter };