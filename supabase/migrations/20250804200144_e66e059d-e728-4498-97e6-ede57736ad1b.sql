-- Fix currency_display_settings primary key constraint
-- Change primary key from id to shop_id since each shop should have one setting

ALTER TABLE currency_display_settings DROP CONSTRAINT IF EXISTS currency_display_settings_pkey;
ALTER TABLE currency_display_settings ADD CONSTRAINT currency_display_settings_pkey PRIMARY KEY (shop_id);

-- Make sure shop_id is not nullable since it's now the primary key
ALTER TABLE currency_display_settings ALTER COLUMN shop_id SET NOT NULL;

-- Remove the id column since we're using shop_id as primary key
ALTER TABLE currency_display_settings DROP COLUMN id;