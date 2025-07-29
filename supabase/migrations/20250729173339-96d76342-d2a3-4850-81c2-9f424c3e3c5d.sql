-- حذف القانون الموجود وإعادة إنشائه
DROP POLICY IF EXISTS "allow_shopify_store_form_creation" ON forms;

-- إنشاء قانون محدث للسماح بإنشاء النماذج
CREATE POLICY "allow_shopify_store_form_creation" ON forms
FOR INSERT 
WITH CHECK (
  -- السماح للمستخدمين المصادق عليهم تقليدياً
  (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
  OR
  -- السماح للمتاجر Shopify (باستخدام المستخدم الافتراضي)
  (user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893' AND shop_id IS NOT NULL)
  OR
  -- السماح للمستخدمين المجهولين مؤقتاً لأغراض الاختبار
  (auth.uid() IS NULL AND user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893')
);