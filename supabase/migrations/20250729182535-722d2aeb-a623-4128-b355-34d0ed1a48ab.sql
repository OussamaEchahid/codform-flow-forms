-- Fix RLS policy for quantity_offers table
DROP POLICY IF EXISTS "users_manage_own_offers" ON quantity_offers;

-- Create new policy that allows authenticated users to manage offers for their shops
CREATE POLICY "authenticated_users_manage_quantity_offers" 
ON quantity_offers 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND (
    -- User owns the shop
    EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shop = quantity_offers.shop_id 
      AND user_id = auth.uid()
    )
    OR
    -- Allow the main system user to manage offers
    auth.uid()::text = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'
    OR
    -- Allow if user_id matches
    user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- User owns the shop
    EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shop = quantity_offers.shop_id 
      AND user_id = auth.uid()
    )
    OR
    -- Allow the main system user to create offers
    auth.uid()::text = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'
    OR
    -- Allow if user_id matches
    user_id = auth.uid()
  )
);

-- Update any existing quantity_offers records to have the correct user_id
UPDATE quantity_offers 
SET user_id = (
  SELECT user_id FROM shopify_stores 
  WHERE shop = quantity_offers.shop_id 
  LIMIT 1
)
WHERE user_id IS NULL;