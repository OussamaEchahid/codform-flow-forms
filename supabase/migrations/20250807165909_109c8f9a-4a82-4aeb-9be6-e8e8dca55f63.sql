-- إزالة الـ check constraint الحالي إذا كان موجوداً
ALTER TABLE public.advertising_pixels DROP CONSTRAINT IF EXISTS advertising_pixels_platform_check;

-- إضافة check constraint جديد يدعم جميع المنصات
ALTER TABLE public.advertising_pixels 
ADD CONSTRAINT advertising_pixels_platform_check 
CHECK (platform IN ('Facebook', 'TikTok', 'Snapchat', 'facebook', 'tiktok', 'snapchat'));

-- تحديث البيانات الموجودة لتكون متسقة مع القيم الجديدة
UPDATE public.advertising_pixels 
SET platform = CASE 
  WHEN LOWER(platform) = 'facebook' THEN 'Facebook'
  WHEN LOWER(platform) = 'tiktok' THEN 'TikTok' 
  WHEN LOWER(platform) = 'snapchat' THEN 'Snapchat'
  ELSE platform
END;