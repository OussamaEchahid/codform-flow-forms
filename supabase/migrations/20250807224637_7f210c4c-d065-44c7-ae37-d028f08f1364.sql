-- Tighten RLS policies and remove temporary wide-open access per security hardening (A + B)

-- 1) FORMS: remove temporary access and restrict to owner, while allowing public read of published forms
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "forms_temporary_access" ON public.forms;

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

-- Allow public to read published forms for storefront rendering
CREATE POLICY "Public can view published forms"
ON public.forms FOR SELECT
USING (is_published = true);

-- 2) QUANTITY_OFFERS: remove temporary access and restrict to store owner
ALTER TABLE public.quantity_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quantity_offers_temporary_access" ON public.quantity_offers;

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

-- 3) SHOPIFY_PRODUCT_SETTINGS: lock down access to owner
ALTER TABLE public.shopify_product_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_settings_access" ON public.shopify_product_settings;

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

-- 4) FORM_SUBMISSIONS: remove temp access; allow owners to view their submissions
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "submissions_temporary_access" ON public.form_submissions;

-- Keep existing INSERT policies as-is (public submissions + published forms constraint)
-- Add select policy for owners via shop_id or form ownership
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

-- 5) ORDERS: remove temp access and restrict to owner for all operations
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_temporary_access" ON public.orders;
DROP POLICY IF EXISTS "authenticated_users_create_orders" ON public.orders;

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
