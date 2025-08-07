-- حذف السياسات الموجودة أولاً
DROP POLICY IF EXISTS "Users can create pixels for their shops" ON advertising_pixels;
DROP POLICY IF EXISTS "Users can view their own pixels" ON advertising_pixels;
DROP POLICY IF EXISTS "Users can update their own pixels" ON advertising_pixels;
DROP POLICY IF EXISTS "Users can delete their own pixels" ON advertising_pixels;
DROP POLICY IF EXISTS "Allow public access to advertising_pixels" ON advertising_pixels;

-- إنشاء سياسات جديدة للمستخدمين المصادقين فقط
-- سياسة لعرض البيكسلز الخاصة بالمستخدم فقط
CREATE POLICY "Users can view their own pixels"
ON advertising_pixels
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = advertising_pixels.shop_id 
    AND shopify_stores.user_id = auth.uid()
  )
);

-- سياسة لإنشاء البيكسلز للمتاجر التي يملكها المستخدم
CREATE POLICY "Users can create pixels for their shops"
ON advertising_pixels
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = advertising_pixels.shop_id 
    AND shopify_stores.user_id = auth.uid()
  )
);

-- سياسة لتحديث البيكسلز الخاصة بالمستخدم
CREATE POLICY "Users can update their own pixels"
ON advertising_pixels
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = advertising_pixels.shop_id 
    AND shopify_stores.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = advertising_pixels.shop_id 
    AND shopify_stores.user_id = auth.uid()
  )
);

-- سياسة لحذف البيكسلز الخاصة بالمستخدم
CREATE POLICY "Users can delete their own pixels"
ON advertising_pixels
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = advertising_pixels.shop_id 
    AND shopify_stores.user_id = auth.uid()
  )
);