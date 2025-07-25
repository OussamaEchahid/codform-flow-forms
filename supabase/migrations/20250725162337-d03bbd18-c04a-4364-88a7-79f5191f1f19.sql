-- حل مؤقت: تعطيل RLS على جدول shopify_stores لحل مشكلة الوصول
ALTER TABLE shopify_stores DISABLE ROW LEVEL SECURITY;

-- إضافة تعليق للتذكير
COMMENT ON TABLE shopify_stores IS 'RLS temporarily disabled to fix access issues';