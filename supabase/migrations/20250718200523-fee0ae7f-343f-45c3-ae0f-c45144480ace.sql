-- حذف policy الموجود وإنشاء جديد
DROP POLICY IF EXISTS "Allow reading forms by shop_id for public access" ON public.forms;
DROP POLICY IF EXISTS "Users can view their own forms or shop forms" ON public.forms;

-- إنشاء policy شامل للقراءة
CREATE POLICY "Allow reading forms for authenticated users and shops"
ON public.forms
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text) 
  OR 
  (shop_id IS NOT NULL)
);