CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  match_id INT NOT NULL REFERENCES blood_request_matches(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'in_app')),
  template_name VARCHAR(100),
  provider_message_id VARCHAR(255),
  status VARCHAR(30) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  payload JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_match_id
ON notifications(match_id);

CREATE INDEX IF NOT EXISTS idx_notifications_provider_message_id
ON notifications(provider_message_id);