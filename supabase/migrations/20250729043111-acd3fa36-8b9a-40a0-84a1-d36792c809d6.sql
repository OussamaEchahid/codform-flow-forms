-- حذف جميع البيانات المتعلقة بالمتاجر والنماذج والطلبات
-- حذف الإرسالات أولاً
DELETE FROM form_submissions;

-- حذف الطلبات
DELETE FROM orders;

-- حذف السلال المهجورة
DELETE FROM abandoned_carts;

-- حذف إعدادات منتجات شوبيفاي
DELETE FROM shopify_product_settings;

-- حذف عروض الكمية
DELETE FROM quantity_offers;

-- حذف إعدادات Google Sheets
DELETE FROM google_sheets_configs;

-- حذف إدراج النماذج في شوبيفاي
DELETE FROM shopify_form_insertion;

-- حذف النماذج
DELETE FROM forms;

-- حذف متاجر شوبيفاي
DELETE FROM shopify_stores;

-- إعادة تعيين sequences إذا كانت موجودة (اختياري)
-- هذا سيجعل المعرفات تبدأ من جديد