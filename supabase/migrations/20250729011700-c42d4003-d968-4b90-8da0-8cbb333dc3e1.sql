-- تنظيف السياسات الموجودة وإضافة سياسات آمنة جديدة

-- حذف السياسات المفتوحة للجميع إذا كانت موجودة
DROP POLICY IF EXISTS "allow_all_forms_access" ON public.forms;
DROP POLICY IF EXISTS "allow_all_store_access" ON public.shopify_stores;
DROP POLICY IF EXISTS "allow_all_product_settings_access" ON public.shopify_product_settings;
DROP POLICY IF EXISTS "allow_all_quantity_offers_access" ON public.quantity_offers;

-- حذف السياسات الموجودة التي قد تتعارض
DROP POLICY IF EXISTS "authenticated_users_manage_own_forms" ON public.forms;
DROP POLICY IF EXISTS "authenticated_users_view_own_stores" ON public.shopify_stores;
DROP POLICY IF EXISTS "authenticated_users_update_own_stores" ON public.shopify_stores;
DROP POLICY IF EXISTS "system_can_insert_stores" ON public.shopify_stores;
DROP POLICY IF EXISTS "authenticated_users_manage_own_product_settings" ON public.shopify_product_settings;
DROP POLICY IF EXISTS "authenticated_users_manage_own_quantity_offers" ON public.quantity_offers;
DROP POLICY IF EXISTS "public_access_published_forms" ON public.forms;
DROP POLICY IF EXISTS "allow_submissions_for_published_forms" ON public.form_submissions;

-- إضافة سياسات آمنة جديدة للجدول forms
CREATE POLICY "users_manage_own_forms" 
ON public.forms 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "public_view_published_forms" 
ON public.forms 
FOR SELECT 
USING (is_published = true);

-- إضافة سياسات آمنة جديدة للجدول shopify_stores
CREATE POLICY "users_view_own_stores" 
ON public.shopify_stores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_stores" 
ON public.shopify_stores 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "allow_store_creation" 
ON public.shopify_stores 
FOR INSERT 
WITH CHECK (true);

-- إضافة سياسات آمنة جديدة للجدول shopify_product_settings
CREATE POLICY "users_manage_own_settings" 
ON public.shopify_product_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- إضافة سياسات آمنة جديدة للجدول quantity_offers
CREATE POLICY "users_manage_own_offers" 
ON public.quantity_offers 
FOR ALL 
USING (auth.uid() = user_id);

-- السماح بإنشاء submissions للنماذج المنشورة
CREATE POLICY "allow_form_submissions" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM forms 
    WHERE id::text = form_submissions.form_id 
    AND is_published = true
  )
);