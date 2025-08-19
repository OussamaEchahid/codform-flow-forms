-- Add country_tag column to forms table for visual country flags
-- This is separate from the country column which is used for Country & Currency Settings

ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS country_tag text;

-- Set default country_tag based on existing country values
UPDATE public.forms 
SET country_tag = country 
WHERE country_tag IS NULL AND country IS NOT NULL;

-- Set default country_tag to 'SA' for forms without country
UPDATE public.forms 
SET country_tag = 'SA' 
WHERE country_tag IS NULL;

-- Add comment to clarify the difference
COMMENT ON COLUMN public.forms.country IS 'Country for form settings and currency (Country & Currency Settings)';
COMMENT ON COLUMN public.forms.country_tag IS 'Visual country flag tag for display purposes only';
