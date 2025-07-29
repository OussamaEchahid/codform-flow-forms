-- Fix quantity_offers RLS policy to allow saving offers correctly
DROP POLICY IF EXISTS "users_can_manage_shop_offers" ON quantity_offers;

-- Create a more permissive policy for quantity offers
CREATE POLICY "allow_quantity_offers_management" 
ON quantity_offers 
FOR ALL 
USING (
  -- Allow authenticated users who own the shop or are the main system user
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shop = quantity_offers.shop_id 
      AND (user_id = auth.uid() OR user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid)
    )
    OR
    user_id = auth.uid()
    OR
    user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Update existing quantity_offers to have correct user_id
UPDATE quantity_offers 
SET user_id = COALESCE(
  (SELECT user_id FROM shopify_stores WHERE shop = quantity_offers.shop_id LIMIT 1),
  '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid
)
WHERE user_id IS NULL;