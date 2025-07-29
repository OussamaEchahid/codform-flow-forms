-- إزالة جميع policies الموجودة
DROP POLICY IF EXISTS "users_manage_own_settings" ON public.shopify_product_settings;
DROP POLICY IF EXISTS "allow_authenticated_users_manage_settings" ON public.shopify_product_settings;
DROP POLICY IF EXISTS "allow_public_read_published_form_settings" ON public.shopify_product_settings;

-- إنشاء policies جديدة محسنة
CREATE POLICY "shopify_product_settings_full_access" 
ON public.shopify_product_settings
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid()::text = user_id::text OR 
    user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid OR
    EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shop = shopify_product_settings.shop_id 
      AND user_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid()::text = user_id::text OR 
    user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid OR
    EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shop = shopify_product_settings.shop_id 
      AND user_id = auth.uid()
    )
  )
);

-- السماح للمستخدمين المجهولين بقراءة إعدادات المنتجات للنماذج المنشورة
CREATE POLICY "shopify_product_settings_public_read" 
ON public.shopify_product_settings
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM forms 
    WHERE forms.id = shopify_product_settings.form_id 
    AND forms.is_published = true
  )
);