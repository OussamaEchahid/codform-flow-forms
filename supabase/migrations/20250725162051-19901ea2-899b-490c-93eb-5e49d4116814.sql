-- إصلاح RLS policies لجدول shopify_stores

-- حذف جميع RLS policies الموجودة
DROP POLICY IF EXISTS "Users can view stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can update stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can insert stores" ON shopify_stores;  
DROP POLICY IF EXISTS "Users can delete stores" ON shopify_stores;

-- إنشاء RLS policies جديدة مرنة تسمح بالوصول للمتاجر اليتيمة
CREATE POLICY "Allow access to stores" 
ON shopify_stores 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL) OR
  (auth.role() = 'authenticated')
);

CREATE POLICY "Allow updating stores" 
ON shopify_stores 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL) OR
  (auth.role() = 'authenticated')
)
WITH CHECK (
  (auth.uid() = user_id) OR
  (user_id IS NULL) OR
  (auth.role() = 'authenticated')
);

CREATE POLICY "Allow inserting stores" 
ON shopify_stores 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR
  (user_id IS NULL) OR
  (auth.role() = 'authenticated')
);

CREATE POLICY "Allow deleting stores" 
ON shopify_stores 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL) OR
  (auth.role() = 'authenticated')
);