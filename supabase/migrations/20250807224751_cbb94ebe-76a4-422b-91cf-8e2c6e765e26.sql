-- Idempotent RLS hardening: drop conflicting policies first, then (re)create desired ones

-- FORMS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "forms_temporary_access" ON public.forms;
DROP POLICY IF EXISTS "Users can select own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can insert own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can update own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can delete own forms" ON public.forms;
DROP POLICY IF EXISTS "Public can view published forms" ON public.forms;

CREATE POLICY "Users can select own forms"
ON public.forms FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own forms"
ON public.forms FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own forms"
ON public.forms FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own forms"
ON public.forms FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Public can view published forms"
ON public.forms FOR SELECT
USING (is_published = true);

-- QUANTITY_OFFERS
ALTER TABLE public.quantity_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quantity_offers_temporary_access" ON public.quantity_offers;
DROP POLICY IF EXISTS "Owners manage quantity_offers" ON public.quantity_offers;

CREATE POLICY "Owners manage quantity_offers"
ON public.quantity_offers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = quantity_offers.shop_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = quantity_offers.shop_id
      AND s.user_id = auth.uid()
  )
);

-- SHOPIFY_PRODUCT_SETTINGS
ALTER TABLE public.shopify_product_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_settings_access" ON public.shopify_product_settings;
DROP POLICY IF EXISTS "Owners manage product settings" ON public.shopify_product_settings;

CREATE POLICY "Owners manage product settings"
ON public.shopify_product_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = shopify_product_settings.shop_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = shopify_product_settings.shop_id
      AND s.user_id = auth.uid()
  )
);

-- FORM_SUBMISSIONS
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "submissions_temporary_access" ON public.form_submissions;
DROP POLICY IF EXISTS "Owners view form submissions" ON public.form_submissions;

CREATE POLICY "Owners view form submissions"
ON public.form_submissions FOR SELECT
USING (
  (shop_id IS NOT NULL AND EXISTS (
     SELECT 1 FROM public.shopify_stores s
     WHERE s.shop = form_submissions.shop_id AND s.user_id = auth.uid()
  ))
  OR
  (EXISTS (
     SELECT 1 FROM public.forms f
     WHERE (f.id)::text = form_submissions.form_id AND f.user_id = auth.uid()
  ))
);

-- ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_temporary_access" ON public.orders;
DROP POLICY IF EXISTS "authenticated_users_create_orders" ON public.orders;
DROP POLICY IF EXISTS "Owners view orders" ON public.orders;
DROP POLICY IF EXISTS "Owners insert orders" ON public.orders;
DROP POLICY IF EXISTS "Owners update orders" ON public.orders;
DROP POLICY IF EXISTS "Owners delete orders" ON public.orders;

CREATE POLICY "Owners view orders"
ON public.orders FOR SELECT
USING (
  shop_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = orders.shop_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Owners insert orders"
ON public.orders FOR INSERT
WITH CHECK (
  shop_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = orders.shop_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Owners update orders"
ON public.orders FOR UPDATE
USING (
  shop_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = orders.shop_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Owners delete orders"
ON public.orders FOR DELETE
USING (
  shop_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = orders.shop_id AND s.user_id = auth.uid()
  )
);
