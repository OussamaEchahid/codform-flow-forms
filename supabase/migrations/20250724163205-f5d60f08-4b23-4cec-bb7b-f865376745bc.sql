-- Update the existing codmagnet.com record and set it as active
UPDATE shopify_stores 
SET is_active = true, updated_at = now()
WHERE shop = 'codmagnet.com';

-- Deactivate all other stores
UPDATE shopify_stores 
SET is_active = false, updated_at = now()
WHERE shop != 'codmagnet.com';