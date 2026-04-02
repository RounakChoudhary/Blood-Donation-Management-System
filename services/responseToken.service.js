const crypto = require("crypto");

const ResponseToken = require("../models/responseToken.model");
const Match = require("../models/bloodRequestMatch.model");

const RESPONSE_TOKEN_SECRET = process.env.RESPONSE_TOKEN_SECRET || process.env.JWT_SECRET;
const RESPONSE_TOKEN_TTL_HOURS = 2;

function requireSecret() {
  if (!RESPONSE_TOKEN_SECRET) {
    throw new Error("RESPONSE_TOKEN_SECRET or JWT_SECRET must be configured");
  }
}

function signPayload(payload) {
  requireSecret();
  return crypto
    .createHmac("sha256", RESPONSE_TOKEN_SECRET)
    .update(payload)
    .digest("hex");
}

function buildRawToken() {
  const payload = crypto.randomBytes(32).toString("hex");
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function timingSafeEquals(a, b) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  if (first.length !== second.length) {
    return false;
  }

  return crypto.timingSafeEqual(first, second);
}

function verifyTokenSignature(rawToken) {
  requireSecret();

  if (!rawToken || typeof rawToken !== "string") {
    return false;
  }

  const [payload, signature] = rawToken.split(".");
  if (!payload || !signature) {
    return false;
  }

  const expected = signPayload(payload);
  return timingSafeEquals(signature, expected);
}

function buildExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + RESPONSE_TOKEN_TTL_HOURS);
  return expiresAt;
}

async function issueResponseToken({ match_id, donor_id }) {
  const rawToken = buildRawToken();
  const token_hash = hashToken(rawToken);
  const expires_at = buildExpiryDate();

  await ResponseToken.invalidateActiveTokens({ match_id, donor_id });

  await ResponseToken.createResponseToken({
    match_id,
    donor_id,
    token_hash,
    expires_at,
  });

  return {
    rawToken,
    expires_at,
  };
}

async function verifyResponseToken(rawToken) {
  if (!verifyTokenSignature(rawToken)) {
    return null;
  }

  const token_hash = hashToken(rawToken);
  return ResponseToken.getActiveTokenByHash(token_hash);
}

async function consumeResponseToken(id) {
  return ResponseToken.markTokenUsed(id);
}

async function consumeTokensForMatch({ match_id, donor_id }) {
  await ResponseToken.invalidateActiveTokens({ match_id, donor_id });
}

async function expirePendingResponses() {
  const expiredTokens = await ResponseToken.getExpiredUnusedTokens();
  if (!expiredTokens.length) {
    return {
      expired_token_count: 0,
      updated_match_count: 0,
      request_ids: [],
    };
  }

  const matchIds = [...new Set(expiredTokens.map((token) => Number(token.match_id)))];
  const updatedMatches = await Match.markExpiredMatchesAsNoResponse(matchIds);
  await ResponseToken.markExpiredTokensUsed(expiredTokens.map((token) => token.id));

  return {
    expired_token_count: expiredTokens.length,
    updated_match_count: updatedMatches.length,
    request_ids: [...new Set(updatedMatches.map((match) => Number(match.request_id)))],
  };
}

module.exports = {
  issueResponseToken,
  verifyResponseToken,
  consumeResponseToken,
  consumeTokensForMatch,
  expirePendingResponses,
};
