-- إزالة جميع policies للجدول بشكل كامل
DROP POLICY IF EXISTS "shopify_product_settings_full_access" ON public.shopify_product_settings;
DROP POLICY IF EXISTS "shopify_product_settings_public_read" ON public.shopify_product_settings;

-- إنشاء policy واحد شامل لجميع العمليات
CREATE POLICY "manage_product_settings" 
ON public.shopify_product_settings
FOR ALL
USING (
  -- السماح للمستخدمين المصادقين الذين يملكون الصف أو المتجر
  (auth.uid() IS NOT NULL AND (
    auth.uid()::text = user_id::text OR 
    user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid OR
    EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shop = shopify_product_settings.shop_id 
      AND user_id = auth.uid()
    )
  )) OR
  -- السماح للمستخدمين المجهولين بقراءة إعدادات النماذج المنشورة فقط
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM forms 
    WHERE forms.id = shopify_product_settings.form_id 
    AND forms.is_published = true
  ))
)
WITH CHECK (
  -- للعمليات التي تعدل البيانات، يجب أن يكون المستخدم مصادق
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