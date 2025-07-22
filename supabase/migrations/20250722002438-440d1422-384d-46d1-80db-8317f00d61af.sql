-- إصلاح RLS policies لجدول النماذج
-- حذف السياسات القديمة أولاً
DROP POLICY IF EXISTS "forms_select_by_shop" ON public.forms;
DROP POLICY IF EXISTS "forms_insert_by_shop" ON public.forms;
DROP POLICY IF EXISTS "forms_update_by_shop" ON public.forms;
DROP POLICY IF EXISTS "forms_delete_by_shop" ON public.forms;
DROP POLICY IF EXISTS "forms_shop_access" ON public.forms;

-- إنشاء سياسات جديدة أكثر وضوحاً
-- سياسة للقراءة - السماح للجميع بقراءة النماذج بناء على shop_id
CREATE POLICY "forms_select_policy" 
ON public.forms 
FOR SELECT 
USING (shop_id IS NOT NULL);

-- سياسة للإدراج - السماح للجميع بإدراج النماذج
CREATE POLICY "forms_insert_policy" 
ON public.forms 
FOR INSERT 
WITH CHECK (shop_id IS NOT NULL);

-- سياسة للتحديث - السماح للجميع بتحديث النماذج
CREATE POLICY "forms_update_policy" 
ON public.forms 
FOR UPDATE 
USING (shop_id IS NOT NULL);

-- سياسة للحذف - السماح للجميع بحذف النماذج
CREATE POLICY "forms_delete_policy" 
ON public.forms 
FOR DELETE 
USING (shop_id IS NOT NULL);