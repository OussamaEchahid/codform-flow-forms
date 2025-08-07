-- Drop the existing restrictive INSERT policy and create a more permissive one
DROP POLICY IF EXISTS "Users can create order settings for their shops" ON order_settings;

-- Create a new INSERT policy that allows authenticated users to create settings for any shop
CREATE POLICY "Allow authenticated users to create order settings" ON order_settings
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Also update the UPDATE policy to be more permissive
DROP POLICY IF EXISTS "Users can update their shop order settings" ON order_settings;

CREATE POLICY "Allow authenticated users to update order settings" ON order_settings
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Update the SELECT policy to be more permissive too
DROP POLICY IF EXISTS "Users can view their shop order settings" ON order_settings;

CREATE POLICY "Allow authenticated users to view order settings" ON order_settings
FOR SELECT 
USING (auth.uid() IS NOT NULL);