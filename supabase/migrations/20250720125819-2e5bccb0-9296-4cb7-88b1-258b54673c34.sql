
-- Add country, currency, and phone_prefix columns to forms table
ALTER TABLE public.forms 
ADD COLUMN country TEXT DEFAULT 'SA',
ADD COLUMN currency TEXT DEFAULT 'SAR',
ADD COLUMN phone_prefix TEXT DEFAULT '+966';

-- Update existing forms to have default values
UPDATE public.forms 
SET country = 'SA', currency = 'SAR', phone_prefix = '+966' 
WHERE country IS NULL OR currency IS NULL OR phone_prefix IS NULL;
