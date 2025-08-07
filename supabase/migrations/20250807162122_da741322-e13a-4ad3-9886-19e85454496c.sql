-- حذف جميع الـ policies الموجودة لجدول advertising_pixels
DROP POLICY IF EXISTS "Users can view their store pixels" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can create pixels for their stores" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can update their store pixels" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can delete their store pixels" ON public.advertising_pixels;
DROP POLICY IF EXISTS "advertising_pixels_access" ON public.advertising_pixels;

-- إنشاء policies صحيحة لفصل البيانات بين المستخدمين
CREATE POLICY "Users can view their store pixels"
ON public.advertising_pixels 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = advertising_pixels.shop_id 
    AND shopify_stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create pixels for their stores"
ON public.advertising_pixels 
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = advertising_pixels.shop_id 
    AND shopify_stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their store pixels"
ON public.advertising_pixels 
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = advertising_pixels.shop_id 
    AND shopify_stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their store pixels"
ON public.advertising_pixels 
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = advertising_pixels.shop_id 
    AND shopify_stores.user_id = auth.uid()
  )
);