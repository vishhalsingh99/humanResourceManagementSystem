// Request logger middleware
const logger = (req, res, next) => {
  const start = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      usersAgent: req.get('users-agent'),
      timestamp: new Date().toISOString()
    };

    // Log to console (could be extended to file or logging service)
    // console.log(JSON.stringify(log));
  });

  next();
};

export { logger };