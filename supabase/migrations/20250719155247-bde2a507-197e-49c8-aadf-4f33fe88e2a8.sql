-- حذف جميع السياسات المكررة من جدول النماذج
DROP POLICY IF EXISTS "Allow reading forms by shop" ON public.forms;
DROP POLICY IF EXISTS "Allow reading forms by shop_id" ON public.forms;
DROP POLICY IF EXISTS "Allow creating forms by shop" ON public.forms;
DROP POLICY IF EXISTS "Allow creating forms by shop_id" ON public.forms;
DROP POLICY IF EXISTS "Allow updating forms by shop" ON public.forms;
DROP POLICY IF EXISTS "Allow updating forms by shop_id" ON public.forms;
DROP POLICY IF EXISTS "Allow deleting forms by shop" ON public.forms;
DROP POLICY IF EXISTS "Allow deleting forms by shop_id" ON public.forms;

-- إنشاء سياسات جديدة بأسماء واضحة
CREATE POLICY "forms_select_by_shop" 
ON public.forms 
FOR SELECT 
USING (shop_id IS NOT NULL);

CREATE POLICY "forms_insert_by_shop" 
ON public.forms 
FOR INSERT 
WITH CHECK (shop_id IS NOT NULL);

CREATE POLICY "forms_update_by_shop" 
ON public.forms 
FOR UPDATE 
USING (shop_id IS NOT NULL);

CREATE POLICY "forms_delete_by_shop" 
ON public.forms 
FOR DELETE 
USING (shop_id IS NOT NULL);