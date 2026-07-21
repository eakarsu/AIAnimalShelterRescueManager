BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT;
UPDATE users SET tenant_id = 'default' WHERE tenant_id IS NULL;
ALTER TABLE users ALTER COLUMN tenant_id SET DEFAULT 'default';
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS shelter_users_id_tenant_uidx ON users(id, tenant_id);
CREATE TABLE IF NOT EXISTS shelter_cases (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  animal_id INTEGER REFERENCES animals(id) ON DELETE RESTRICT,
  external_reference TEXT,
  state TEXT NOT NULL DEFAULT 'intake' CHECK (state IN ('intake','assessed','quarantined','approved','fostered','adopted','follow_up','closed')),
  intake_source TEXT NOT NULL,
  welfare_flags JSONB NOT NULL DEFAULT '[]',
  provenance JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, external_reference),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS shelter_cases_tenant_state_idx ON shelter_cases(tenant_id, state);
CREATE TABLE IF NOT EXISTS shelter_case_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  case_id BIGINT NOT NULL,
  actor_id INTEGER NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  rationale TEXT,
  evidence JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (case_id, tenant_id) REFERENCES shelter_cases(id, tenant_id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS shelter_integration_outbox (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  case_id BIGINT,
  provider TEXT NOT NULL CHECK (provider IN ('microchip','veterinary','messaging','payments','public_listing')),
  operation TEXT NOT NULL,
  payload_reference TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivering','delivered','failed','dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, provider, idempotency_key),
  FOREIGN KEY (case_id, tenant_id) REFERENCES shelter_cases(id, tenant_id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS shelter_validation_runs (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, created_by INTEGER NOT NULL REFERENCES users(id),
  cohort_reference TEXT NOT NULL, metrics JSONB NOT NULL, reviewed_outcome_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION reject_shelter_event_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'shelter_case_events is append-only'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS shelter_events_append_only ON shelter_case_events;
CREATE TRIGGER shelter_events_append_only BEFORE UPDATE OR DELETE ON shelter_case_events
FOR EACH ROW EXECUTE FUNCTION reject_shelter_event_mutation();
COMMIT;
