-- 🔧 تنظيف قاعدة البيانات من المتاجر الوهمية
-- Cleanup fake/default shop entries from database

-- 1. حذف جميع السجلات المرتبطة بـ default.myshopify.com
DELETE FROM public.general_settings WHERE shop_id = 'default.myshopify.com';
DELETE FROM public.order_settings WHERE shop_id = 'default.myshopify.com';
DELETE FROM public.forms WHERE shop_id = 'default.myshopify.com';
DELETE FROM public.quantity_offers WHERE shop_id = 'default.myshopify.com';
DELETE FROM public.shopify_product_settings WHERE shop_id = 'default.myshopify.com';
DELETE FROM public.orders WHERE shop_id = 'default.myshopify.com';
DELETE FROM public.abandoned_carts WHERE shop_id = 'default.myshopify.com';
DELETE FROM public.form_submissions WHERE shop_id = 'default.myshopify.com';
DELETE FROM public.shopify_form_insertion WHERE shop_id = 'default.myshopify.com';
DELETE FROM public.currency_settings WHERE shop_domain = 'default.myshopify.com';
DELETE FROM public.shop_subscriptions WHERE shop_domain = 'default.myshopify.com';

-- 2. حذف أي متاجر وهمية أخرى
DELETE FROM public.shopify_stores WHERE shop = 'default.myshopify.com';
DELETE FROM public.shopify_stores WHERE shop = 'default-shop.myshopify.com';
DELETE FROM public.shopify_stores WHERE shop LIKE 'default%myshopify.com';

-- 3. تأكيد وجود المتجر الحقيقي astrem.myshopify.com
INSERT INTO public.shopify_stores (shop, is_active, access_token, scope, token_type, created_at, updated_at)
VALUES (
  'astrem.myshopify.com',
  true,
  'active_token',
  'write_content,write_orders,write_products,write_script_tags,write_themes',
  'Bearer',
  NOW(),
  NOW()
)
ON CONFLICT (shop) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- 4. إضافة constraint لمنع إدراج متاجر وهمية في المستقبل
ALTER TABLE public.shopify_stores 
ADD CONSTRAINT check_valid_shop_domain 
CHECK (
  shop ~ '^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]\.myshopify\.com$' 
  OR shop ~ '^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$'
);

-- 5. إضافة constraint للجداول الأخرى لمنع استخدام متاجر وهمية
ALTER TABLE public.forms 
ADD CONSTRAINT check_valid_shop_id 
CHECK (shop_id != 'default.myshopify.com' AND shop_id != 'default-shop.myshopify.com');

ALTER TABLE public.general_settings 
ADD CONSTRAINT check_valid_shop_id 
CHECK (shop_id != 'default.myshopify.com' AND shop_id != 'default-shop.myshopify.com');

-- 6. تسجيل التنظيف
INSERT INTO public.system_logs (event_type, message, created_at)
VALUES (
  'database_cleanup',
  'Cleaned up default.myshopify.com and other fake shop entries',
  NOW()
);
