-- إضافة عمود user_id لجدول advertising_pixels
ALTER TABLE public.advertising_pixels 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- تحديث البيانات الموجودة لتحتوي على الـ user_id الافتراضي
UPDATE public.advertising_pixels 
SET user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid
WHERE user_id IS NULL;

-- تحديث RLS policies لتستخدم user_id بدلاً من shop_id
DROP POLICY IF EXISTS "Users can view pixels for their shops" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can create pixels for their shops" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can update pixels for their shops" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can delete pixels for their shops" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can view their own pixels" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can create their own pixels" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can update their own pixels" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can delete their own pixels" ON public.advertising_pixels;

-- إنشاء policies جديدة تعتمد على user_id
CREATE POLICY "Users can view their own pixels"
ON public.advertising_pixels 
FOR SELECT 
USING (user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid);

CREATE POLICY "Users can create their own pixels"
ON public.advertising_pixels 
FOR INSERT 
WITH CHECK (user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid);

CREATE POLICY "Users can update their own pixels"
ON public.advertising_pixels 
FOR UPDATE 
USING (user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid)
WITH CHECK (user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid);

CREATE POLICY "Users can delete their own pixels"
ON public.advertising_pixels 
FOR DELETE 
USING (user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid);