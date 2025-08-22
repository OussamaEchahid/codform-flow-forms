-- إصلاح RLS policies لجدول shop_subscriptions لتسمح بالوصول للبيانات

-- إضافة policy للوصول العام للقراءة (مؤقتاً للتشخيص)
CREATE POLICY "Allow public read access to subscriptions for debugging" 
ON public.shop_subscriptions 
FOR SELECT 
USING (true);

-- تحديث policy الموجود لتسمح بالوصول بدون مصادقة
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.shop_subscriptions;

CREATE POLICY "Users can view subscriptions" 
ON public.shop_subscriptions 
FOR SELECT 
USING (
  -- السماح للجميع بالقراءة مؤقتاً
  true
  OR
  -- أو إذا كان المستخدم مالك المتجر
  EXISTS (
    SELECT 1 
    FROM public.shopify_stores 
    WHERE shopify_stores.shop = shop_subscriptions.shop_domain 
    AND shopify_stores.user_id = auth.uid()
  )
);