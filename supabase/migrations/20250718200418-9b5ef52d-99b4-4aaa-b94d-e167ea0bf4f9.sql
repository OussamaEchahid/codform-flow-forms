-- إضافة policy للسماح بقراءة Forms للمتاجر من خلال shop_id
CREATE POLICY "Allow reading forms by shop_id for public access"
ON public.forms
FOR SELECT
USING (shop_id IS NOT NULL);

-- تحديث policy الموجود لدعم النفاذ العام للمتاجر
DROP POLICY IF EXISTS "Users can view their own forms" ON public.forms;

CREATE POLICY "Users can view their own forms or shop forms"
ON public.forms
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text) 
  OR 
  (shop_id IS NOT NULL)
);