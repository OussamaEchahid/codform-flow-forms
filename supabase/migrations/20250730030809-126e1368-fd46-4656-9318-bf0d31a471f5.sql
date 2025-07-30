-- إنشاء دالة للحصول على البريد الإلكتروني الحالي
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_email text;
BEGIN
  -- محاولة الحصول على البريد من المتجر النشط
  SELECT email INTO user_email 
  FROM shopify_stores 
  WHERE shop = current_setting('request.headers', true)::json->>'x-shop-id'
    AND email IS NOT NULL 
    AND email != ''
  LIMIT 1;
  
  -- إذا لم نجد، استخدم البريد الافتراضي من المتجر
  IF user_email IS NULL THEN
    SELECT CONCAT('owner@', shop) INTO user_email
    FROM shopify_stores 
    WHERE shop = current_setting('request.headers', true)::json->>'x-shop-id'
    LIMIT 1;
  END IF;
  
  RETURN user_email;
END;
$$;

-- تحديث RLS policies للجداول الرئيسية لتعتمد على البريد الإلكتروني

-- تحديث سياسات forms
DROP POLICY IF EXISTS "forms_full_access" ON public.forms;

CREATE POLICY "forms_email_based_access" 
ON public.forms 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores s 
    WHERE s.shop = forms.shop_id 
    AND (s.email = public.get_current_user_email() OR CONCAT('owner@', s.shop) = public.get_current_user_email())
  )
);

-- تحديث سياسات shopify_stores
DROP POLICY IF EXISTS "allow_email_based_access" ON public.shopify_stores;
DROP POLICY IF EXISTS "users_view_own_stores" ON public.shopify_stores;
DROP POLICY IF EXISTS "users_update_own_stores" ON public.shopify_stores;

CREATE POLICY "stores_email_based_view" 
ON public.shopify_stores 
FOR SELECT 
USING (
  email = public.get_current_user_email() 
  OR CONCAT('owner@', shop) = public.get_current_user_email()
);

CREATE POLICY "stores_email_based_update" 
ON public.shopify_stores 
FOR UPDATE 
USING (
  email = public.get_current_user_email() 
  OR CONCAT('owner@', shop) = public.get_current_user_email()
);

-- تحديث سياسات form_submissions
DROP POLICY IF EXISTS "authenticated_users_view_submissions_for_forms" ON public.form_submissions;

CREATE POLICY "submissions_email_based_access" 
ON public.form_submissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM forms f 
    JOIN shopify_stores s ON s.shop = f.shop_id
    WHERE f.id::text = form_submissions.form_id 
    AND (s.email = public.get_current_user_email() OR CONCAT('owner@', s.shop) = public.get_current_user_email())
  )
);

-- تحديث سياسات orders
DROP POLICY IF EXISTS "authenticated_users_view_shop_orders" ON public.orders;
DROP POLICY IF EXISTS "authenticated_users_update_shop_orders" ON public.orders;

CREATE POLICY "orders_email_based_view" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores s 
    WHERE s.shop = orders.shop_id 
    AND (s.email = public.get_current_user_email() OR CONCAT('owner@', s.shop) = public.get_current_user_email())
  )
);

CREATE POLICY "orders_email_based_update" 
ON public.orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores s 
    WHERE s.shop = orders.shop_id 
    AND (s.email = public.get_current_user_email() OR CONCAT('owner@', s.shop) = public.get_current_user_email())
  )
);

-- تحديث سياسات quantity_offers
DROP POLICY IF EXISTS "quantity_offers_full_access" ON public.quantity_offers;

CREATE POLICY "quantity_offers_email_based_access" 
ON public.quantity_offers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores s 
    WHERE s.shop = quantity_offers.shop_id 
    AND (s.email = public.get_current_user_email() OR CONCAT('owner@', s.shop) = public.get_current_user_email())
  )
);