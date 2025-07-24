-- حذف النطاق من جدول المتاجر - هذا خطأ كبير
DELETE FROM shopify_stores WHERE shop = 'codmagnet.com';

-- تفعيل متجر واحد فقط من المتاجر الحقيقية
UPDATE shopify_stores SET is_active = false WHERE shop != 'bestform-app.myshopify.com';
UPDATE shopify_stores SET is_active = true WHERE shop = 'bestform-app.myshopify.com';