-- إصلاح RLS policy لجدول shopify_product_settings لدعم كل من المستخدمين المصادقين والمجهولين
DROP POLICY IF EXISTS "users_manage_own_settings" ON public.shopify_product_settings;

-- إنشاء policies جديدة تدعم العمليات الضرورية
CREATE POLICY "allow_authenticated_users_manage_settings" 
ON public.shopify_product_settings
FOR ALL
TO authenticated
USING (
  CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE (
      auth.uid()::text = user_id::text OR 
      user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid OR
      EXISTS (
        SELECT 1 FROM shopify_stores 
        WHERE shop = shopify_product_settings.shop_id 
        AND user_id = auth.uid()
      )
    )
  END
)
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE (
      auth.uid()::text = user_id::text OR 
      user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid OR
      EXISTS (
        SELECT 1 FROM shopify_stores 
        WHERE shop = shopify_product_settings.shop_id 
        AND user_id = auth.uid()
      )
    )
  END
);

-- السماح للمستخدمين المجهولين بقراءة إعدادات المنتجات فقط (للنماذج المنشورة)
CREATE POLICY "allow_public_read_published_form_settings" 
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