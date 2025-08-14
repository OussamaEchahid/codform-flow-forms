-- حذف الـ policies القديمة والإبقاء على الجديدة فقط
DROP POLICY IF EXISTS "authenticated_users_create_shop_carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "authenticated_users_update_shop_carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "authenticated_users_view_shop_carts" ON public.abandoned_carts;

-- إعادة إنشاء policies بسيطة للعامة
DROP POLICY IF EXISTS "allow_public_abandoned_cart_creation" ON public.abandoned_carts;
DROP POLICY IF EXISTS "allow_public_abandoned_cart_updates" ON public.abandoned_carts;

CREATE POLICY "public_can_create_abandoned_carts"
ON public.abandoned_carts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "public_can_update_abandoned_carts"
ON public.abandoned_carts
FOR UPDATE
USING (true);

CREATE POLICY "authenticated_users_can_view_shop_carts"
ON public.abandoned_carts
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM shopify_stores
    WHERE shopify_stores.shop = abandoned_carts.shop_id
    AND shopify_stores.user_id = auth.uid()
  )
);