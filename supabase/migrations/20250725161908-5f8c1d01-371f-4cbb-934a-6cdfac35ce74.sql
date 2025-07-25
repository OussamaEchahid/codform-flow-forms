-- إصلاح RLS policies لجدول shopify_stores للسماح بالوصول للمتاجر القديمة
-- وربط المتاجر الموجودة بدون user_id بالمستخدم الحالي

-- حذف RLS policies الحالية
DROP POLICY IF EXISTS "Users can view their own stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can update their own stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can insert their own stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can delete their own stores" ON shopify_stores;

-- إنشاء RLS policies جديدة أكثر مرونة
CREATE POLICY "Users can view stores" 
ON shopify_stores 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL) OR
  (auth.role() = 'authenticated')
);

CREATE POLICY "Users can update stores" 
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

CREATE POLICY "Users can insert stores" 
ON shopify_stores 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR
  (user_id IS NULL) OR
  (auth.role() = 'authenticated')
);

CREATE POLICY "Users can delete stores" 
ON shopify_stores 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL) OR
  (auth.role() = 'authenticated')
);

-- ربط المتاجر الموجودة بدون user_id بأي مستخدم مصادق عليه
-- إنشاء function لربط المتاجر اليتيمة
CREATE OR REPLACE FUNCTION link_orphan_stores_to_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ربط المتاجر التي بدون user_id بالمستخدم الحالي إذا كان مصادق عليه
  IF auth.uid() IS NOT NULL THEN
    UPDATE shopify_stores 
    SET user_id = auth.uid(), 
        updated_at = now()
    WHERE user_id IS NULL 
      AND is_active = true;
    
    RAISE NOTICE 'Linked orphan stores to user %', auth.uid();
  END IF;
END;
$$;