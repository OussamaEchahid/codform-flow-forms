-- إنشاء جدول اشتراكات المتاجر (مع التحقق من وجود النوع)
DO $$ BEGIN
    CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'premium', 'unlimited');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- إنشاء جدول اشتراكات المتاجر
CREATE TABLE IF NOT EXISTS public.shop_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain TEXT NOT NULL UNIQUE,
  plan_type subscription_plan NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active', -- active, suspended, cancelled
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, yearly
  price_amount DECIMAL(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  trial_days_remaining INTEGER DEFAULT 0,
  trial_started_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ DEFAULT now(),
  next_billing_date TIMESTAMPTZ,
  shopify_charge_id TEXT, -- لربط مع Shopify Partners
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- تفعيل RLS للجدول
ALTER TABLE public.shop_subscriptions ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة إن وجدت
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.shop_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.shop_subscriptions;
DROP POLICY IF EXISTS "Users can create subscriptions for their stores" ON public.shop_subscriptions;

-- سياسة للمستخدمين المصادقين لرؤية اشتراكاتهم فقط
CREATE POLICY "Users can view their own subscriptions" ON public.shop_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = shop_subscriptions.shop_domain 
    AND shopify_stores.user_id = auth.uid()
  )
);

-- سياسة للتحديث
CREATE POLICY "Users can update their own subscriptions" ON public.shop_subscriptions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = shop_subscriptions.shop_domain 
    AND shopify_stores.user_id = auth.uid()
  )
);

-- سياسة للإدراج
CREATE POLICY "Users can create subscriptions for their stores" ON public.shop_subscriptions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = shop_subscriptions.shop_domain 
    AND shopify_stores.user_id = auth.uid()
  )
);

-- إضافة trigger لتحديث updated_at (مع التحقق من الوجود)
DROP TRIGGER IF EXISTS update_shop_subscriptions_updated_at ON public.shop_subscriptions;
CREATE TRIGGER update_shop_subscriptions_updated_at
  BEFORE UPDATE ON public.shop_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء دالة للحصول على خطة المتجر
CREATE OR REPLACE FUNCTION public.get_shop_subscription(p_shop_domain TEXT)
RETURNS TABLE(
  plan_type subscription_plan,
  status TEXT,
  trial_days_remaining INTEGER,
  next_billing_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.plan_type,
    s.status,
    s.trial_days_remaining,
    s.next_billing_date
  FROM shop_subscriptions s
  WHERE s.shop_domain = p_shop_domain;
END;
$$;

-- إدراج اشتراكات افتراضية للمتاجر الموجودة
INSERT INTO public.shop_subscriptions (shop_domain, plan_type, user_id)
SELECT 
  shop,
  'free'::subscription_plan,
  user_id
FROM shopify_stores
WHERE is_active = true
ON CONFLICT (shop_domain) DO NOTHING;

-- إنشاء دالة لترقية الخطة
CREATE OR REPLACE FUNCTION public.upgrade_shop_plan(
  p_shop_domain TEXT,
  p_new_plan subscription_plan,
  p_shopify_charge_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  plan_prices RECORD;
BEGIN
  -- تحديد أسعار الخطط
  SELECT 
    CASE p_new_plan
      WHEN 'free' THEN 0.00
      WHEN 'basic' THEN 9.99
      WHEN 'premium' THEN 29.99
      WHEN 'unlimited' THEN 99.99
    END as price
  INTO plan_prices;

  -- تحديث الاشتراك
  UPDATE shop_subscriptions 
  SET 
    plan_type = p_new_plan,
    price_amount = plan_prices.price,
    shopify_charge_id = COALESCE(p_shopify_charge_id, shopify_charge_id),
    next_billing_date = CASE 
      WHEN p_new_plan = 'free' THEN NULL
      ELSE now() + INTERVAL '1 month'
    END,
    updated_at = now()
  WHERE shop_domain = p_shop_domain;

  RETURN FOUND;
END;
$$;