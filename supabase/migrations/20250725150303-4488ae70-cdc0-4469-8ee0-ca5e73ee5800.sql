-- إصلاح تضارب الدوال
-- حذف الدالة الموجودة أولاً ثم إنشاؤها بالتوقيع الصحيح

DROP FUNCTION IF EXISTS get_user_stores_by_email(text);

-- دالة للحصول على متاجر المستخدم بناءً على البريد الإلكتروني
CREATE OR REPLACE FUNCTION get_user_stores_by_email(p_email TEXT DEFAULT NULL)
RETURNS TABLE(
  shop TEXT,
  email TEXT,
  user_id UUID,
  access_token TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  plan_type TEXT,
  subscription_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- استخدام البريد الإلكتروني المُمرر أو بريد المستخدم الحالي
  user_email := COALESCE(p_email, auth.email());
  
  RETURN QUERY
  SELECT 
    s.shop,
    s.email,
    s.user_id,
    s.access_token,
    s.is_active,
    s.created_at,
    s.updated_at,
    COALESCE(sub.plan_type, 'free') as plan_type,
    COALESCE(sub.status, 'inactive') as subscription_status
  FROM shopify_stores s
  LEFT JOIN shop_subscriptions sub ON s.shop = sub.shop_domain
  WHERE 
    s.email = user_email OR 
    s.user_id = auth.uid()
  ORDER BY s.updated_at DESC;
END;
$$;