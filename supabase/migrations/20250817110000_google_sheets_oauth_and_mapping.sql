-- Google OAuth tokens table
CREATE TABLE IF NOT EXISTS public.google_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  shop_id text,
  email text,
  access_token text NOT NULL,
  refresh_token text,
  token_type text,
  scope text,
  expiry timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_shop ON public.google_oauth_tokens(shop_id);
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_user ON public.google_oauth_tokens(user_id);

-- Trigger to auto update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tokens_updated_at ON public.google_oauth_tokens;
CREATE TRIGGER trg_tokens_updated_at
BEFORE UPDATE ON public.google_oauth_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extend google_sheets_configs for direct Sheets API usage
ALTER TABLE IF EXISTS public.google_sheets_configs
  ADD COLUMN IF NOT EXISTS spreadsheet_id text,
  ADD COLUMN IF NOT EXISTS spreadsheet_name text,
  ADD COLUMN IF NOT EXISTS sheet_id text,
  ADD COLUMN IF NOT EXISTS sheet_title text;

-- Per-form mappings
CREATE TABLE IF NOT EXISTS public.google_sheets_form_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id text NOT NULL,
  form_id uuid NOT NULL,
  spreadsheet_id text NOT NULL,
  spreadsheet_name text,
  sheet_id text NOT NULL,
  sheet_title text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_form_mapping_per_shop ON public.google_sheets_form_mappings(shop_id, form_id);
CREATE INDEX IF NOT EXISTS idx_form_mappings_shop ON public.google_sheets_form_mappings(shop_id);

DROP TRIGGER IF EXISTS trg_form_mappings_updated_at ON public.google_sheets_form_mappings;
CREATE TRIGGER trg_form_mappings_updated_at
BEFORE UPDATE ON public.google_sheets_form_mappings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

