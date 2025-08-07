-- تحديث الـ policies لتعمل مع النهج المستخدم في المشروع
-- حذف الـ policies الحالية
DROP POLICY IF EXISTS "Users can view their store pixels" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can create pixels for their stores" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can update their store pixels" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can delete their store pixels" ON public.advertising_pixels;

-- إنشاء policies تعمل مع النهج المستخدم في المشروع
-- السماح للعمليات الأساسية مع التحقق من shop_id
CREATE POLICY "Allow operations for valid shops"
ON public.advertising_pixels 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = advertising_pixels.shop_id 
    AND shopify_stores.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = advertising_pixels.shop_id 
    AND shopify_stores.is_active = true
  )
);