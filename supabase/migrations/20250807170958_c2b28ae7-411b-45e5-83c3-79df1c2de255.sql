-- إيقاف RLS مؤقتاً لحذف السياسات
ALTER TABLE public.order_settings DISABLE ROW LEVEL SECURITY;

-- حذف جميع السياسات بقوة
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'order_settings' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.order_settings', r.policyname);
    END LOOP;
END$$;

-- إعادة تفعيل RLS
ALTER TABLE public.order_settings ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسة الصحيحة
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