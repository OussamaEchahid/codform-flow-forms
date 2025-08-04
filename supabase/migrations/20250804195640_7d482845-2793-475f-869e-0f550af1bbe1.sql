-- Fix currency_display_settings primary key to auto-increment
-- Drop the default constraint and make it a proper serial column

ALTER TABLE currency_display_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE currency_display_settings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

-- Update any existing records to use proper shop_id as primary key concept
-- Since id should be unique per shop, let's restructure this properly
ALTER TABLE currency_display_settings DROP CONSTRAINT IF EXISTS currency_display_settings_pkey;
ALTER TABLE currency_display_settings ADD CONSTRAINT currency_display_settings_pkey PRIMARY KEY (shop_id);

-- Make sure shop_id is not nullable since it's now the primary key
ALTER TABLE currency_display_settings ALTER COLUMN shop_id SET NOT NULL;