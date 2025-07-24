-- Update the simple connection manager to use codmagnet.com
-- Clean up all localStorage connections and set codmagnet.com as the default

-- Create a function to update localStorage references
CREATE OR REPLACE FUNCTION public.update_default_store_connection()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function will help ensure consistent store connection
  -- The frontend will use this as reference
  RETURN 'codmagnet.com';
END;
$$;

-- Make sure codmagnet.com is the only active store
UPDATE shopify_stores 
SET is_active = false 
WHERE shop != 'codmagnet.com';

UPDATE shopify_stores 
SET is_active = true 
WHERE shop = 'codmagnet.com';