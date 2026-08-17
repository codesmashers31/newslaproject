// Performance logger middleware to track API execution times
export const perfLogger = (req, res, next) => {
  const start = Date.now();
  const path = req.originalUrl || req.url;

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 100 || process.env.NODE_ENV !== 'production') {
      console.log(`[PERF] ${req.method} ${path} - ${duration}ms (Status: ${res.statusCode})`);
    }
  });

  next();
};
