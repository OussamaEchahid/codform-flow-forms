-- تفعيل Row Level Security على جدول order_settings
ALTER TABLE public.order_settings ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة إذا كانت موجودة
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.order_settings;

-- إنشاء سياسات جديدة تتبع نهج المشروع
-- السماح بالقراءة للمتاجر النشطة
CREATE POLICY "order_settings_shop_access_select" 
ON public.order_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = order_settings.shop_id 
    AND shopify_stores.is_active = true
  )
);

-- السماح بالإدراج للمتاجر النشطة
CREATE POLICY "order_settings_shop_access_insert" 
ON public.order_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = order_settings.shop_id 
    AND shopify_stores.is_active = true
  )
);

-- السماح بالتحديث للمتاجر النشطة
CREATE POLICY "order_settings_shop_access_update" 
ON public.order_settings 
FOR UPDATE 
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

-- السماح بالحذف للمتاجر النشطة
CREATE POLICY "order_settings_shop_access_delete" 
ON public.order_settings 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = order_settings.shop_id 
    AND shopify_stores.is_active = true
  )
);