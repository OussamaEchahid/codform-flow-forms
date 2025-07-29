-- Drop existing policy
DROP POLICY IF EXISTS "authenticated_users_manage_quantity_offers" ON quantity_offers;

-- Create new policy that allows authenticated users to manage offers for their shops  
CREATE POLICY "users_can_manage_shop_offers" 
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
    user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid
    OR
    -- Allow if user_id matches current user
    user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- User owns the shop for new records
    EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shop = quantity_offers.shop_id 
      AND user_id = auth.uid()
    )
    OR
    -- Allow the main system user to create offers
    user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid
    OR
    -- Allow if user_id matches current user
    user_id = auth.uid()
  )
);

-- Set user_id for existing records without it
UPDATE quantity_offers 
SET user_id = (
  SELECT user_id FROM shopify_stores 
  WHERE shop = quantity_offers.shop_id 
  LIMIT 1
)
WHERE user_id IS NULL;