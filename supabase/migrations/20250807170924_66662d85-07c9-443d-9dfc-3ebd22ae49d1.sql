-- حذف جميع السياسات الموجودة
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.order_settings;
DROP POLICY IF EXISTS "order_settings_shop_access_select" ON public.order_settings;
DROP POLICY IF EXISTS "order_settings_shop_access_insert" ON public.order_settings;
DROP POLICY IF EXISTS "order_settings_shop_access_update" ON public.order_settings;
DROP POLICY IF EXISTS "order_settings_shop_access_delete" ON public.order_settings;

-- تفعيل Row Level Security إذا لم يكن مفعلاً
ALTER TABLE public.order_settings ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة واحدة شاملة تتبع نهج المشروع (مثل باقي الجداول)
CREATE POLICY "order_settings_shop_access" 
ON public.order_settings 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = order_settings.shop_id 
    AND shopify_stores.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = order_settings.shop_id 
    AND shopify_stores.is_active = true
  )
);