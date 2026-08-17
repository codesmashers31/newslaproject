// Performance logger middleware to track API execution times & granular query breakdowns
export const perfLogger = (req, res, next) => {
  const start = Date.now();
  req._perfTimings = {};

  req.recordTiming = (label, durationMs) => {
    req._perfTimings[label] = durationMs;
  };

  res.on('finish', () => {
    const totalDuration = Date.now() - start;
    const path = req.originalUrl || req.url;

    // Set Server-Timing header for browser DevTools network audit
    const timingHeader = Object.entries(req._perfTimings)
      .map(([k, v]) => `${k};dur=${v}`)
      .concat([`total;dur=${totalDuration}`])
      .join(', ');

    try {
      res.setHeader('Server-Timing', timingHeader);
    } catch (e) {
      // Header already sent
    }

    const breakdown = Object.entries(req._perfTimings)
      .map(([k, v]) => `${k}: ${v}ms`)
      .join(', ');

    console.log(`[PERF] ${req.method} ${path} - Total: ${totalDuration}ms ${breakdown ? `(${breakdown})` : ''} (Status: ${res.statusCode})`);
  });

  next();
};
