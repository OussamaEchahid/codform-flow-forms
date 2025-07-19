-- منح صلاحيات للمستخدم anonymous للوصول لجدول النماذج
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- منح صلاحيات للمستخدمين المعرّفين
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO authenticated;

-- منح صلاحيات للجداول الأخرى المطلوبة
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopify_product_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopify_product_settings TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopify_stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopify_stores TO authenticated;