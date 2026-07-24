BEGIN;
CREATE TABLE IF NOT EXISTS shelter_ai_results (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  feature TEXT NOT NULL,
  input JSONB NOT NULL,
  provider_request_id TEXT NOT NULL UNIQUE,
  provider_model TEXT NOT NULL,
  result_text TEXT NOT NULL,
  provider_receipt JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS shelter_ai_results_tenant_feature_created_idx ON shelter_ai_results(tenant_id, feature, created_at DESC);
COMMIT;
