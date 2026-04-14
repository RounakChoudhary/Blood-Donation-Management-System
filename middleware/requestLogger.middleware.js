function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const logEntry = {
      level: "info",
      type: "http_request",
      request_id: req.requestId || null,
      method: req.method,
      path: req.originalUrl,
      status_code: res.statusCode,
      duration_ms: durationMs,
      ip: req.ip || req.socket?.remoteAddress || null,
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(logEntry));
  });

  next();
}

module.exports = requestLogger;
