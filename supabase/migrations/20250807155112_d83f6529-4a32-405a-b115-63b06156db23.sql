-- تحديث RLS policies لجدول advertising_pixels
DROP POLICY IF EXISTS "Users can view pixels for their shops" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can create pixels for their shops" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can update pixels for their shops" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can delete pixels for their shops" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can view their own pixels" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can create their own pixels" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can update their own pixels" ON public.advertising_pixels;
DROP POLICY IF EXISTS "Users can delete their own pixels" ON public.advertising_pixels;

-- إنشاء policies جديدة مبسطة
CREATE POLICY "Allow all operations for project users"
ON public.advertising_pixels 
FOR ALL
USING (user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid)
WITH CHECK (user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid);