-- إصلاح مشاكل أمان قاعدة البيانات والـ RLS

-- 1. إصلاح function search path المخاطر الأمنية
ALTER FUNCTION public.user_owns_store(text) SET search_path TO 'public';
ALTER FUNCTION public.link_store_by_email(text, text) SET search_path TO 'public';
ALTER FUNCTION public.is_session_valid() SET search_path TO 'public';
ALTER FUNCTION public.get_user_stores(uuid) SET search_path TO 'public';
ALTER FUNCTION public.link_store_to_user(text, uuid, text) SET search_path TO 'public';
ALTER FUNCTION public.link_orphan_stores_to_user() SET search_path TO 'public';
ALTER FUNCTION public.get_product_form_and_offers(text, text) SET search_path TO 'public';
ALTER FUNCTION public.fix_form_store_links() SET search_path TO 'public';
ALTER FUNCTION public.get_store_access_token(text) SET search_path TO 'public';
ALTER FUNCTION public.link_active_store_to_user() SET search_path TO 'public';
ALTER FUNCTION public.associate_product_with_form(text, text, uuid, text, boolean) SET search_path TO 'public';
ALTER FUNCTION public.get_user_stores_by_email(text) SET search_path TO 'public';
ALTER FUNCTION public.auto_link_to_main_user() SET search_path TO 'public';
ALTER FUNCTION public.fix_user_ownership() SET search_path TO 'public';

-- 2. إصلاح سياسات RLS للنماذج لتسمح بإنشاء النماذج
DROP POLICY IF EXISTS "users_manage_own_forms" ON forms;
CREATE POLICY "users_manage_own_forms" 
ON forms FOR ALL 
USING (
  CASE 
    WHEN auth.uid() IS NULL THEN false 
    ELSE auth.uid() = user_id 
  END
)
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NULL THEN false 
    ELSE auth.uid() = user_id 
  END
);

-- 3. إصلاح سياسات RLS لإعدادات منتجات شوبيفاي
DROP POLICY IF EXISTS "users_manage_own_settings" ON shopify_product_settings;
CREATE POLICY "users_manage_own_settings" 
ON shopify_product_settings FOR ALL 
USING (
  CASE 
    WHEN auth.uid() IS NULL THEN false 
    ELSE auth.uid() = user_id 
  END
)
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NULL THEN false 
    ELSE auth.uid() = user_id 
  END
);

-- 4. إصلاح سياسات RLS للطلبات
DROP POLICY IF EXISTS "authenticated_users_create_orders" ON orders;
CREATE POLICY "authenticated_users_create_orders" 
ON orders FOR INSERT 
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NULL THEN false 
    ELSE true 
  END
);

-- 5. إصلاح سياسات RLS لإرسالات النماذج
DROP POLICY IF EXISTS "Anyone can create form submissions" ON form_submissions;
CREATE POLICY "allow_public_form_submissions" 
ON form_submissions FOR INSERT 
WITH CHECK (true);

-- 6. إضافة سياسة للسماح بعرض النماذج المنشورة للجميع (بدون تسجيل دخول)
CREATE POLICY "allow_anonymous_view_published_forms" 
ON forms FOR SELECT 
USING (is_published = true);

-- 7. تحديث unique constraint لإعدادات المنتجات لتجنب التضارب
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_shop_product 
ON shopify_product_settings(shop_id, product_id) 
WHERE enabled = true;