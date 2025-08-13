-- Add currency columns to shopify_stores table
ALTER TABLE public.shopify_stores 
ADD COLUMN IF NOT EXISTS currency text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS province text,
ADD COLUMN IF NOT EXISTS timezone text;

-- Add country/currency columns to forms table  
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS country text DEFAULT 'SA',
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'SAR',
ADD COLUMN IF NOT EXISTS phone_prefix text DEFAULT '+966';

-- Update existing forms with default values
UPDATE public.forms 
SET country = 'SA', currency = 'SAR', phone_prefix = '+966'
WHERE country IS NULL OR currency IS NULL OR phone_prefix IS NULL;