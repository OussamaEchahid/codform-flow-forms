-- حذف جميع السياسات الحالية لجدول forms
DROP POLICY IF EXISTS "forms_select_policy" ON public.forms;
DROP POLICY IF EXISTS "forms_insert_policy" ON public.forms;
DROP POLICY IF EXISTS "forms_update_policy" ON public.forms;
DROP POLICY IF EXISTS "forms_delete_policy" ON public.forms;

-- إنشاء سياسات جديدة مبسطة تسمح بالوصول للجميع بناء على shop_id فقط
CREATE POLICY "Enable read access for all users" 
ON public.forms 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for all users" 
ON public.forms 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for all users" 
ON public.forms 
FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete for all users" 
ON public.forms 
FOR DELETE 
USING (true);