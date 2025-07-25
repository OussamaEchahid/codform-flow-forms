-- إصلاح النظام لربط المتاجر بالمستخدمين بشكل صحيح

-- أولاً: إضافة عمود البريد الإلكتروني للمتاجر
ALTER TABLE shopify_stores ADD COLUMN IF NOT EXISTS email text;

-- ثانياً: إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_shopify_stores_email ON shopify_stores(email);
CREATE INDEX IF NOT EXISTS idx_shopify_stores_user_id ON shopify_stores(user_id);

-- ثالثاً: تحديث الدالة لربط المتجر بالمستخدم
CREATE OR REPLACE FUNCTION public.link_store_to_user(
  p_shop text,
  p_user_id uuid,
  p_email text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- تحديث المتجر الموجود أو إنشاء جديد
  INSERT INTO shopify_stores (shop, user_id, email, is_active, created_at, updated_at)
  VALUES (p_shop, p_user_id, p_email, true, now(), now())
  ON CONFLICT (shop)
  DO UPDATE SET 
    user_id = p_user_id,
    email = COALESCE(p_email, shopify_stores.email),
    updated_at = now()
  WHERE shopify_stores.user_id IS NULL OR shopify_stores.user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- رابعاً: دالة للحصول على المتاجر المرتبطة بالمستخدم
CREATE OR REPLACE FUNCTION public.get_user_stores_by_email(p_email text)
RETURNS TABLE(
  shop text,
  user_id uuid,
  access_token text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.shop,
    s.user_id,
    s.access_token,
    s.is_active,
    s.created_at,
    s.updated_at
  FROM shopify_stores s
  WHERE s.email = p_email OR s.user_id = auth.uid()
  ORDER BY s.updated_at DESC;
END;
$$;

-- خامساً: دالة للتحقق من وجود access token صالح
CREATE OR REPLACE FUNCTION public.get_store_access_token(p_shop text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token text;
BEGIN
  SELECT access_token INTO token
  FROM shopify_stores
  WHERE shop = p_shop 
    AND access_token IS NOT NULL 
    AND access_token != ''
    AND (user_id = auth.uid() OR user_id IS NULL)
  LIMIT 1;
  
  RETURN token;
END;
$$;

-- سادساً: تحديث RLS للسماح بالوصول المؤقت للمتاجر بدون user_id
DROP POLICY IF EXISTS "Users can view their own stores" ON shopify_stores;
CREATE POLICY "Users can view their own stores" ON shopify_stores
  FOR SELECT USING (
    auth.uid() = user_id OR 
    user_id IS NULL OR
    email IN (
      SELECT raw_user_meta_data->>'email' 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own stores" ON shopify_stores;
CREATE POLICY "Users can update their own stores" ON shopify_stores
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    user_id IS NULL
  )
  WITH CHECK (auth.uid() = user_id);

-- سابعاً: دالة لربط النماذج الموجودة بالمتاجر الصحيحة
CREATE OR REPLACE FUNCTION public.fix_form_store_links()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ربط النماذج بالمتاجر على أساس shop_id
  UPDATE forms 
  SET user_id = s.user_id
  FROM shopify_stores s
  WHERE forms.shop_id = s.shop
    AND s.user_id IS NOT NULL
    AND forms.user_id != s.user_id;
END;
$$;