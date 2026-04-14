const { Pool } = require("pg");

require("dotenv").config();

function sanitizeDatabaseUrl(value) {
  let sanitized = String(value || "").trim();

  if (
    (sanitized.startsWith('"') && sanitized.endsWith('"')) ||
    (sanitized.startsWith("'") && sanitized.endsWith("'"))
  ) {
    sanitized = sanitized.slice(1, -1).trim();
  }

  return sanitized.replace(/[\r\n]+/g, "");
}

const rawDatabaseUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL);

if (!rawDatabaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

let parsedDatabaseUrl;

try {
  parsedDatabaseUrl = new URL(rawDatabaseUrl);
} catch {
  throw new Error("DATABASE_URL is invalid or incorrectly formatted");
}

if (!parsedDatabaseUrl.hostname) {
  throw new Error("DATABASE_URL must include a database host");
}

if (parsedDatabaseUrl.hostname === "base") {
  throw new Error("DATABASE_URL is misconfigured: database host resolved to 'base'");
}

// We provide TLS settings through the pg client config below, so remove sslmode
// query params that can trigger noisy runtime warnings and ambiguous behavior.
parsedDatabaseUrl.searchParams.delete("sslmode");

const pool = new Pool({
  connectionString: parsedDatabaseUrl.toString(),
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
