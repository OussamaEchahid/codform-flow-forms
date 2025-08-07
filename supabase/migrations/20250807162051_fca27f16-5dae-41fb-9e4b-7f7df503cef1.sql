-- إصلاح مشاركة البيانات بين المستخدمين
-- إزالة policy الخاطئ وإنشاء policies صحيحة

DROP POLICY IF EXISTS "advertising_pixels_access" ON public.advertising_pixels;

-- السماح للمستخدمين برؤية بيكسلات متاجرهم فقط
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

-- السماح للمستخدمين بإنشاء بيكسلات لمتاجرهم فقط
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

-- السماح للمستخدمين بتحديث بيكسلات متاجرهم فقط
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

-- السماح للمستخدمين بحذف بيكسلات متاجرهم فقط
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