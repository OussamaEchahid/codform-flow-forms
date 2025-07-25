-- Fix RLS policies for shopify_stores table
-- The issue is that we cannot directly reference auth.users table in RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can update their own stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can insert their own stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can delete their own stores" ON shopify_stores;

-- Create new working RLS policies that don't reference auth.users table
CREATE POLICY "Users can view their own stores" 
ON shopify_stores 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR user_id IS NULL 
);

CREATE POLICY "Users can insert their own stores" 
ON shopify_stores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores" 
ON shopify_stores 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores" 
ON shopify_stores 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix forms table policies to ensure proper access
DROP POLICY IF EXISTS "Users can view their own forms" ON forms;
CREATE POLICY "Users can view their own forms" 
ON forms 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix shopify_product_settings policies 
DROP POLICY IF EXISTS "Users can view their own product settings" ON shopify_product_settings;
CREATE POLICY "Users can view their own product settings" 
ON shopify_product_settings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update existing unlinked stores to be linked to the current authenticated user
-- This will help recover missing forms and stores
UPDATE shopify_stores 
SET user_id = auth.uid(), updated_at = now() 
WHERE user_id IS NULL 
AND shop IN (
  SELECT DISTINCT shop_id 
  FROM forms 
  WHERE user_id = auth.uid()
);

-- Fix forms that may have lost their user_id connection
UPDATE forms 
SET user_id = s.user_id, updated_at = now()
FROM shopify_stores s 
WHERE forms.shop_id = s.shop 
AND s.user_id IS NOT NULL 
AND (forms.user_id IS NULL OR forms.user_id != s.user_id);

-- Fix product settings that may have lost their user_id connection  
UPDATE shopify_product_settings 
SET user_id = s.user_id, updated_at = now()
FROM shopify_stores s 
WHERE shopify_product_settings.shop_id = s.shop 
AND s.user_id IS NOT NULL 
AND (shopify_product_settings.user_id IS NULL OR shopify_product_settings.user_id != s.user_id);