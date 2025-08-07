-- First drop all existing policies on order_settings
DROP POLICY IF EXISTS "Allow authenticated users to create order settings" ON order_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update order settings" ON order_settings;
DROP POLICY IF EXISTS "Allow authenticated users to view order settings" ON order_settings;
DROP POLICY IF EXISTS "Users can create order settings for their shops" ON order_settings;
DROP POLICY IF EXISTS "Users can update their shop order settings" ON order_settings;
DROP POLICY IF EXISTS "Users can view their shop order settings" ON order_settings;

-- Create new permissive policies
CREATE POLICY "Enable all operations for authenticated users" ON order_settings
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);