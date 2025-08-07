-- حذف جميع الـ policies الموجودة
DROP POLICY IF EXISTS "Allow operations for valid shops" ON public.advertising_pixels;

-- إنشاء policy جديد يعمل مع بنية المشروع
CREATE POLICY "advertising_pixels_shop_access"
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