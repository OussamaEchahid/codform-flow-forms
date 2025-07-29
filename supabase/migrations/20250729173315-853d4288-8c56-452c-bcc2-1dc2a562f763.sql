-- إضافة قانون للسماح بإنشاء النماذج للمتاجر المصادق عليها
CREATE POLICY "allow_shopify_store_form_creation" ON forms
FOR INSERT 
WITH CHECK (
  -- السماح للمستخدمين المصادق عليهم
  (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
  OR
  -- السماح للمتاجر النشطة (باستخدام المستخدم الافتراضي)
  (user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893' AND shop_id IS NOT NULL)
);