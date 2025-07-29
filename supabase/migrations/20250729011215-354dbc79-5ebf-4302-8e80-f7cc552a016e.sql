-- إزالة السياسات غير الآمنة واستبدالها بسياسات آمنة

-- حذف السياسات المفتوحة للجميع
DROP POLICY IF EXISTS "allow_all_forms_access" ON public.forms;
DROP POLICY IF EXISTS "allow_all_store_access" ON public.shopify_stores;
DROP POLICY IF EXISTS "allow_all_product_settings_access" ON public.shopify_product_settings;
DROP POLICY IF EXISTS "allow_all_quantity_offers_access" ON public.quantity_offers;

-- إضافة سياسات آمنة للجدول forms
CREATE POLICY "authenticated_users_manage_own_forms" 
ON public.forms 
FOR ALL 
USING (auth.uid() = user_id);

-- إضافة سياسات آمنة للجدول shopify_stores
CREATE POLICY "authenticated_users_view_own_stores" 
ON public.shopify_stores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_update_own_stores" 
ON public.shopify_stores 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "system_can_insert_stores" 
ON public.shopify_stores 
FOR INSERT 
WITH CHECK (true);

-- إضافة سياسات آمنة للجدول shopify_product_settings
CREATE POLICY "authenticated_users_manage_own_product_settings" 
ON public.shopify_product_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- إضافة سياسات آمنة للجدول quantity_offers
CREATE POLICY "authenticated_users_manage_own_quantity_offers" 
ON public.quantity_offers 
FOR ALL 
USING (auth.uid() = user_id);

-- تحديث دالة للتحقق من ملكية المتجر
CREATE OR REPLACE FUNCTION public.user_owns_store(p_shop_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shop = p_shop_id 
    AND user_id = auth.uid()
  );
END;
$function$;

-- إضافة سياسة للسماح بالوصول العام للنماذج المنشورة فقط (للعرض)
CREATE POLICY "public_access_published_forms" 
ON public.forms 
FOR SELECT 
USING (is_published = true);

-- إضافة سياسة للسماح بإنشاء submissions للنماذج المنشورة
CREATE POLICY "allow_submissions_for_published_forms" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM forms 
    WHERE id::text = form_submissions.form_id 
    AND is_published = true
  )
);

-- تحديث دالة لربط المتاجر بالمستخدمين بناءً على البريد الإلكتروني
CREATE OR REPLACE FUNCTION public.link_store_by_email(p_shop text, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  -- البحث عن المستخدم بالبريد الإلكتروني
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = p_email;
  
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- ربط المتجر بالمستخدم
  UPDATE shopify_stores 
  SET user_id = target_user_id, 
      email = p_email,
      updated_at = now()
  WHERE shop = p_shop;
  
  RETURN true;
END;
$function$;

-- إضافة دالة للتحقق من صحة الجلسة
CREATE OR REPLACE FUNCTION public.is_session_valid()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- التحقق من وجود مستخدم مصادق
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- يمكن إضافة منطق إضافي للتحقق من انتهاء الجلسة هنا
  RETURN true;
END;
$function$;