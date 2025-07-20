
-- حذف قيد المفتاح الخارجي
ALTER TABLE public.form_submissions 
DROP CONSTRAINT IF EXISTS form_submissions_form_id_fkey;

-- حذف السياسات التي تعتمد على form_id
DROP POLICY IF EXISTS "Users can view submissions by shop" ON public.form_submissions;
DROP POLICY IF EXISTS "Users can view submissions for their forms" ON public.form_submissions;

-- تغيير نوع عمود form_id من UUID إلى TEXT
ALTER TABLE public.form_submissions 
ALTER COLUMN form_id TYPE text;

-- إعادة إنشاء السياسات
CREATE POLICY "Users can view submissions for their forms" 
ON public.form_submissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM forms 
    WHERE forms.id::text = form_submissions.form_id 
    AND forms.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can view submissions by shop" 
ON public.form_submissions 
FOR SELECT 
USING (
  shop_id IS NOT NULL OR 
  EXISTS (
    SELECT 1 FROM forms 
    WHERE forms.id::text = form_submissions.form_id 
    AND forms.user_id::text = auth.uid()::text
  )
);
