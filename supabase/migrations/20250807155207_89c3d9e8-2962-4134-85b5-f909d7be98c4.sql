-- إزالة جميع الـ policies وإعادة إنشائها
DROP POLICY IF EXISTS "Allow all operations for project users" ON public.advertising_pixels;

-- إنشاء policy مبسط جداً
CREATE POLICY "advertising_pixels_access"
ON public.advertising_pixels 
FOR ALL
USING (true)
WITH CHECK (true);