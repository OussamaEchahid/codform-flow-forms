-- Add currency and money format fields to shopify_stores table
ALTER TABLE public.shopify_stores 
ADD COLUMN currency text,
ADD COLUMN money_format text,
ADD COLUMN money_with_currency_format text;

-- Update existing stores with default values
UPDATE public.shopify_stores 
SET currency = 'USD', 
    money_format = '${{amount}}', 
    money_with_currency_format = '${{amount}} USD'
WHERE currency IS NULL;