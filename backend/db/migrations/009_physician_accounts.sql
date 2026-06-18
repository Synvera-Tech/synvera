-- Migration 009: Physician accounts table.
-- Maps Clerk user identities to Synvera physician records.
-- email and name are nullable — populated from the Clerk token or profile sync.
CREATE TABLE IF NOT EXISTS physician_accounts (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT        UNIQUE NOT NULL,
    email         TEXT,
    name          TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
