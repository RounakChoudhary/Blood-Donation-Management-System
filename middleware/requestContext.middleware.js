const crypto = require("crypto");

function generateRequestId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return crypto.randomBytes(16).toString("hex");
}

function requestContext(req, res, next) {
  const headerRequestId = req.headers["x-request-id"];
  const requestId = typeof headerRequestId === "string" && headerRequestId.trim()
    ? headerRequestId.trim()
    : generateRequestId();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

module.exports = requestContext;
