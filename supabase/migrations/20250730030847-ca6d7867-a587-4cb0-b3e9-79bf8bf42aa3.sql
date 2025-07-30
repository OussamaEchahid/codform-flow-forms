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
  -- محاولة الحصول على البريد من localStorage في frontend
  -- هذه الدالة ستستخدم مع headers من frontend
  RETURN 'placeholder@email.com';
END;
$$;

-- حذف السياسات الموجودة وإعادة إنشائها
DROP POLICY IF EXISTS "forms_email_based_access" ON public.forms;
DROP POLICY IF EXISTS "stores_email_based_view" ON public.shopify_stores;
DROP POLICY IF EXISTS "stores_email_based_update" ON public.shopify_stores;
DROP POLICY IF EXISTS "submissions_email_based_access" ON public.form_submissions;
DROP POLICY IF EXISTS "orders_email_based_view" ON public.orders;
DROP POLICY IF EXISTS "orders_email_based_update" ON public.orders;
DROP POLICY IF EXISTS "quantity_offers_email_based_access" ON public.quantity_offers;

-- تفعيل RLS على الجداول
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantity_offers ENABLE ROW LEVEL SECURITY;

-- سياسات مؤقتة للوصول الكامل حتى نطبق النظام بالكامل
CREATE POLICY "forms_temporary_access" ON public.forms FOR ALL USING (true);
CREATE POLICY "stores_temporary_access" ON public.shopify_stores FOR ALL USING (true);
CREATE POLICY "submissions_temporary_access" ON public.form_submissions FOR ALL USING (true);
CREATE POLICY "orders_temporary_access" ON public.orders FOR ALL USING (true);
CREATE POLICY "quantity_offers_temporary_access" ON public.quantity_offers FOR ALL USING (true);