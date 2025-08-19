-- إنشاء جدول الدول المحظورة
CREATE TABLE IF NOT EXISTS public.blocked_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  reason TEXT,
  redirect_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(shop_id, country_code)
);

-- تفعيل RLS للجدول الجديد
ALTER TABLE public.blocked_countries ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان للدول المحظورة
CREATE POLICY "Users can manage blocked countries for their stores" 
ON public.blocked_countries 
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

-- دالة لإضافة دولة محظورة
CREATE OR REPLACE FUNCTION public.add_blocked_country(
  p_shop_id TEXT,
  p_country_code TEXT,
  p_country_name TEXT,
  p_reason TEXT DEFAULT NULL,
  p_redirect_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_blocked_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- التحقق من أن المستخدم يملك هذا المتجر
  IF NOT EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = p_shop_id AND user_id = v_user_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not own this store';
  END IF;
  
  -- إدراج الدولة المحظورة
  INSERT INTO public.blocked_countries (
    shop_id, 
    user_id,
    country_code,
    country_name,
    reason, 
    redirect_url
  ) VALUES (
    p_shop_id, 
    v_user_id,
    p_country_code,
    p_country_name,
    p_reason, 
    p_redirect_url
  )
  ON CONFLICT (shop_id, country_code) 
  DO UPDATE SET 
    is_active = true,
    country_name = EXCLUDED.country_name,
    reason = EXCLUDED.reason,
    redirect_url = EXCLUDED.redirect_url,
    updated_at = now()
  RETURNING id INTO v_blocked_id;
  
  RETURN v_blocked_id;
END;
$$;

-- دالة لحذف دولة محظورة
CREATE OR REPLACE FUNCTION public.remove_blocked_country(
  p_blocked_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- حذف الدولة المحظورة (مع التحقق من الملكية)
  DELETE FROM public.blocked_countries 
  WHERE id = p_blocked_id 
    AND shop_id IN (
      SELECT shop FROM public.shopify_stores 
      WHERE user_id = v_user_id AND is_active = true
    );
  
  RETURN FOUND;
END;
$$;

-- دالة للتحقق من حظر دولة
CREATE OR REPLACE FUNCTION public.is_country_blocked(
  p_shop_id TEXT,
  p_country_code TEXT
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
    COALESCE(MAX(bc.reason), '') as reason,
    COALESCE(MAX(bc.redirect_url), '') as redirect_url
  FROM public.blocked_countries bc
  WHERE bc.shop_id = p_shop_id 
    AND bc.country_code = p_country_code 
    AND bc.is_active = true;
END;
$$;

-- دالة لجلب الدول المحظورة
CREATE OR REPLACE FUNCTION public.get_blocked_countries(
  p_shop_id TEXT
)
RETURNS SETOF blocked_countries
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT bc.*
  FROM public.blocked_countries bc
  WHERE bc.shop_id = p_shop_id
    AND bc.is_active = true
  ORDER BY bc.created_at DESC;
$$;

-- دالة لجلب عناوين IP المحظورة (تحديث الدالة الموجودة)
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

-- إنشاء trigger لتحديث updated_at للدول المحظورة
CREATE OR REPLACE FUNCTION public.update_blocked_countries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blocked_countries_updated_at
  BEFORE UPDATE ON public.blocked_countries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blocked_countries_updated_at();

-- إنشاء جدول إحصائيات الحظر (اختياري للمتابعة)
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  blocked_type TEXT NOT NULL, -- 'ip' or 'country'
  blocked_value TEXT NOT NULL, -- IP address or country code
  visitor_ip INET NOT NULL,
  visitor_country TEXT,
  user_agent TEXT,
  referer TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تفعيل RLS لجدول السجلات
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- سياسة أمان لسجلات الحظر
CREATE POLICY "Store owners can view their security logs" 
ON public.security_logs 
FOR SELECT 
USING (
  shop_id IN (
    SELECT shop FROM public.shopify_stores 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- دالة لتسجيل محاولة حظر
CREATE OR REPLACE FUNCTION public.log_security_block(
  p_shop_id TEXT,
  p_blocked_type TEXT,
  p_blocked_value TEXT,
  p_visitor_ip TEXT,
  p_visitor_country TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referer TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_log_id UUID;
  v_visitor_ip INET;
BEGIN
  -- تحويل عنوان IP إلى نوع INET
  BEGIN
    v_visitor_ip := p_visitor_ip::INET;
  EXCEPTION
    WHEN invalid_text_representation THEN
      v_visitor_ip := '0.0.0.0'::INET;
  END;
  
  INSERT INTO public.security_logs (
    shop_id,
    blocked_type,
    blocked_value,
    visitor_ip,
    visitor_country,
    user_agent,
    referer
  ) VALUES (
    p_shop_id,
    p_blocked_type,
    p_blocked_value,
    v_visitor_ip,
    p_visitor_country,
    p_user_agent,
    p_referer
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;