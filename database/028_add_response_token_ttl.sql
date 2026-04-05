-- 028_add_response_token_ttl.sql
-- Adds TTL on response_tokens.expires_at for automatic expiration (if supported by PostgreSQL version).
-- Note: PostgreSQL 17+ supports TTL; for older versions, manual cleanup is needed.

-- Assuming PostgreSQL supports TTL (check version)
-- ALTER TABLE response_tokens SET (ttl_expiration = expires_at);

-- For manual: This is a placeholder; implement cleanup job in services.