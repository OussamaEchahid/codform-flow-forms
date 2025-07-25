-- حذف policies الموجودة وإعادة إنشائها
-- ==========================================

-- حذف جميع policies القديمة لجدول shopify_stores
DROP POLICY IF EXISTS "flexible_store_access" ON shopify_stores;
DROP POLICY IF EXISTS "authenticated_users_select_own_stores" ON shopify_stores;
DROP POLICY IF EXISTS "authenticated_users_insert_own_stores" ON shopify_stores;
DROP POLICY IF EXISTS "authenticated_users_update_own_stores" ON shopify_stores;
DROP POLICY IF EXISTS "authenticated_users_delete_own_stores" ON shopify_stores;

-- إنشاء policy مرن جديد للمتاجر
CREATE POLICY "allow_all_store_access" ON shopify_stores
FOR ALL USING (true);

-- حذف policies قديمة لجدول shopify_product_settings
DROP POLICY IF EXISTS "flexible_product_settings_access" ON shopify_product_settings;
DROP POLICY IF EXISTS "authenticated_users_view_own_product_settings" ON shopify_product_settings;
DROP POLICY IF EXISTS "authenticated_users_insert_own_product_settings" ON shopify_product_settings;
DROP POLICY IF EXISTS "authenticated_users_update_own_product_settings" ON shopify_product_settings;
DROP POLICY IF EXISTS "authenticated_users_delete_own_product_settings" ON shopify_product_settings;

-- إنشاء policy مرن جديد لإعدادات المنتجات
CREATE POLICY "allow_all_product_settings_access" ON shopify_product_settings
FOR ALL USING (true);

-- حذف policies قديمة لجدول forms
DROP POLICY IF EXISTS "flexible_forms_access" ON forms;
DROP POLICY IF EXISTS "authenticated_users_view_own_forms" ON forms;
DROP POLICY IF EXISTS "authenticated_users_insert_own_forms" ON forms;
DROP POLICY IF EXISTS "authenticated_users_update_own_forms" ON forms;
DROP POLICY IF EXISTS "authenticated_users_delete_own_forms" ON forms;

-- إنشاء policy مرن جديد للنماذج
CREATE POLICY "allow_all_forms_access" ON forms
FOR ALL USING (true);

-- حذف policies قديمة لجدول quantity_offers
DROP POLICY IF EXISTS "authenticated_users_view_own_quantity_offers" ON quantity_offers;
DROP POLICY IF EXISTS "authenticated_users_insert_own_quantity_offers" ON quantity_offers;
DROP POLICY IF EXISTS "authenticated_users_update_own_quantity_offers" ON quantity_offers;
DROP POLICY IF EXISTS "authenticated_users_delete_own_quantity_offers" ON quantity_offers;

-- إنشاء policy مرن جديد لعروض الكمية
CREATE POLICY "allow_all_quantity_offers_access" ON quantity_offers
FOR ALL USING (true);