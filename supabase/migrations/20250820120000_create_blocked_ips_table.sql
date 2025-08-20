-- إنشاء جدول عناوين IP المحظورة
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  ip_address INET NOT NULL,
  reason TEXT,
  redirect_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(shop_id, ip_address)
);

-- تفعيل RLS للجدول الجديد
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان لعناوين IP المحظورة
CREATE POLICY "Users can manage blocked IPs for their stores" 
ON public.blocked_ips 
FOR ALL 
USING (
  shop_id IN (
    SELECT shop FROM public.shopify_stores 
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  shop_id IN (
    SELECT shop FROM public.shopify_stores 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- دالة لإضافة IP محظور
CREATE OR REPLACE FUNCTION public.add_blocked_ip(
  p_shop_id TEXT,
  p_ip_address TEXT,
  p_reason TEXT DEFAULT NULL,
  p_redirect_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id UUID;
  store_user_id UUID;
BEGIN
  -- الحصول على user_id للمتجر
  SELECT user_id INTO store_user_id
  FROM shopify_stores
  WHERE shop = p_shop_id AND is_active = true
  LIMIT 1;
  
  IF store_user_id IS NULL THEN
    RAISE EXCEPTION 'Store not found or inactive';
  END IF;
  
  -- التحقق من وجود IP مسبقاً
  UPDATE blocked_ips 
  SET 
    is_active = true,
    reason = COALESCE(p_reason, reason),
    redirect_url = COALESCE(p_redirect_url, redirect_url),
    updated_at = now()
  WHERE shop_id = p_shop_id 
    AND ip_address = p_ip_address::INET
  RETURNING id INTO new_id;
  
  -- إذا لم يوجد، إنشاء سجل جديد
  IF new_id IS NULL THEN
    INSERT INTO blocked_ips (
      shop_id,
      user_id,
      ip_address,
      reason,
      redirect_url,
      is_active
    ) VALUES (
      p_shop_id,
      store_user_id,
      p_ip_address::INET,
      COALESCE(p_reason, 'غير محدد'),
      COALESCE(p_redirect_url, '/blocked'),
      true
    ) RETURNING id INTO new_id;
  END IF;
  
  RETURN new_id;
END;
$$;

-- دالة للتحقق من حظر IP
CREATE OR REPLACE FUNCTION public.is_ip_blocked(
  p_ip_address TEXT,
  p_shop_id TEXT
)
RETURNS TABLE(is_blocked BOOLEAN, reason TEXT, redirect_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END as is_blocked,
    COALESCE(MAX(bi.reason), '') as reason,
    COALESCE(MAX(bi.redirect_url), '') as redirect_url
  FROM public.blocked_ips bi
  WHERE bi.shop_id = p_shop_id 
    AND bi.ip_address = p_ip_address::INET 
    AND bi.is_active = true;
END;
$$;

-- دالة لجلب عناوين IP المحظورة
CREATE OR REPLACE FUNCTION public.get_blocked_ips(
  p_shop_id TEXT
)
RETURNS SETOF blocked_ips
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT bi.*
  FROM public.blocked_ips bi
  WHERE bi.shop_id = p_shop_id
    AND bi.is_active = true
  ORDER BY bi.created_at DESC;
$$;

-- دالة لإزالة IP من الحظر
CREATE OR REPLACE FUNCTION public.remove_blocked_ip(
  p_ip_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE blocked_ips 
  SET is_active = false, updated_at = now()
  WHERE id = p_ip_id;
  
  RETURN FOUND;
END;
$$;

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_blocked_ips_shop_id ON public.blocked_ips(shop_id);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_address ON public.blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON public.blocked_ips(is_active);
