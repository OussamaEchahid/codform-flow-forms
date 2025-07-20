
-- إضافة عمود shop_id إلى جدول form_submissions
ALTER TABLE public.form_submissions 
ADD COLUMN shop_id text;

-- إضافة فهرس لتحسين الأداء
CREATE INDEX idx_form_submissions_shop_id ON public.form_submissions(shop_id);

-- تحديث سياسة RLS للسماح بالوصول بناءً على shop_id
DROP POLICY IF EXISTS "Anyone can create form submissions" ON public.form_submissions;

CREATE POLICY "Anyone can create form submissions" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (true);

-- إضافة سياسة جديدة للعرض بناءً على shop_id أيضاً
CREATE POLICY "Users can view submissions by shop" 
ON public.form_submissions 
FOR SELECT 
USING (
  shop_id IS NOT NULL OR 
  EXISTS (
    SELECT 1 FROM forms 
    WHERE forms.id = form_submissions.form_id 
    AND forms.user_id::text = auth.uid()::text
  )
);
