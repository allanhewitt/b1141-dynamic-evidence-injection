BEGIN;
CREATE TABLE IF NOT EXISTS activities (
  id text PRIMARY KEY,
  title text NOT NULL,
  model text NOT NULL DEFAULT 'dei' CHECK (model = 'dei'),
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  active boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS activity_sessions (
  id uuid PRIMARY KEY,
  activity_id text NOT NULL REFERENCES activities(id),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  config_snapshot jsonb NOT NULL,
  schema_version_snapshot integer NOT NULL CHECK (schema_version_snapshot > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_dei_session_per_activity ON activity_sessions(activity_id) WHERE status='open';
CREATE TABLE IF NOT EXISTS dei_response_traces (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES activity_sessions(id) ON DELETE CASCADE,
  participant_hash char(64) NOT NULL,
  initial_response smallint NOT NULL CHECK (initial_response BETWEEN 1 AND 5),
  initial_committed_at timestamptz NOT NULL DEFAULT now(),
  information_seen_at timestamptz,
  revised_response smallint CHECK (revised_response BETWEEN 1 AND 5),
  revised_committed_at timestamptz,
  completed_at timestamptz,
  UNIQUE(session_id,participant_hash),
  CHECK ((revised_response IS NULL) = (revised_committed_at IS NULL)),
  CHECK (completed_at IS NULL OR revised_response IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS dei_trace_session_idx ON dei_response_traces(session_id);
COMMIT;
