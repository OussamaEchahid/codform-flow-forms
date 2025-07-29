-- إضافة عمود البريد الإلكتروني إلى جدول المتاجر إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shopify_stores' AND column_name = 'email') THEN
        ALTER TABLE shopify_stores ADD COLUMN email TEXT;
        COMMENT ON COLUMN shopify_stores.email IS 'البريد الإلكتروني لصاحب المتجر من Shopify';
    END IF;
END $$;

-- تحديث دالة get_user_stores_by_email لتعمل مع النظام الجديد
CREATE OR REPLACE FUNCTION public.get_stores_by_email(p_email text)
 RETURNS TABLE(shop text, email text, is_active boolean, updated_at timestamp with time zone, access_token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.shop,
    s.email,
    s.is_active,
    s.updated_at,
    s.access_token
  FROM shopify_stores s
  WHERE s.email = p_email
    AND s.is_active = true
    AND s.access_token IS NOT NULL
    AND s.access_token != ''
    AND s.access_token != 'placeholder_token'
  ORDER BY s.updated_at DESC;
END;
$function$;

-- تحديث RLS policies لتسمح بالوصول على أساس البريد الإلكتروني
DROP POLICY IF EXISTS "allow_email_based_access" ON shopify_stores;
CREATE POLICY "allow_email_based_access" 
ON shopify_stores FOR ALL 
USING (true) 
WITH CHECK (true);