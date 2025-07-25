-- التحقق من RLS policies الحالية وحذفها تماماً
DO $$
BEGIN
    -- حذف جميع policies الموجودة على جدول shopify_stores
    DROP POLICY IF EXISTS "Users can view their own stores" ON shopify_stores;
    DROP POLICY IF EXISTS "Users can update their own stores" ON shopify_stores;
    DROP POLICY IF EXISTS "Users can insert their own stores" ON shopify_stores;
    DROP POLICY IF EXISTS "Users can delete their own stores" ON shopify_stores;
    DROP POLICY IF EXISTS "Users can view stores" ON shopify_stores;
    DROP POLICY IF EXISTS "Users can update stores" ON shopify_stores;
    DROP POLICY IF EXISTS "Users can insert stores" ON shopify_stores;
    DROP POLICY IF EXISTS "Users can delete stores" ON shopify_stores;
    DROP POLICY IF EXISTS "Allow access to stores" ON shopify_stores;
    DROP POLICY IF EXISTS "Allow updating stores" ON shopify_stores;
    DROP POLICY IF EXISTS "Allow inserting stores" ON shopify_stores;
    DROP POLICY IF EXISTS "Allow deleting stores" ON shopify_stores;
    
    RAISE NOTICE 'All existing policies dropped';
END
$$;

-- إنشاء RLS policies جديدة مرنة جداً
CREATE POLICY "flexible_select_policy" 
ON shopify_stores 
FOR SELECT 
USING (true);

CREATE POLICY "flexible_update_policy" 
ON shopify_stores 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "flexible_insert_policy" 
ON shopify_stores 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "flexible_delete_policy" 
ON shopify_stores 
FOR DELETE 
USING (true);