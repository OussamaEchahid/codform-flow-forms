-- Split active vs requested plan and enforce limits only for active subscriptions

-- 1) Add requested_plan_type and requested_at columns
ALTER TABLE public.shop_subscriptions
ADD COLUMN IF NOT EXISTS requested_plan_type public.subscription_plan NULL,
ADD COLUMN IF NOT EXISTS requested_at timestamptz NULL;

-- 2) Update get_shop_limits to consider only ACTIVE subscriptions
CREATE OR REPLACE FUNCTION public.get_shop_limits(p_shop text)
RETURNS TABLE(orders_limit integer, abandoned_limit integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan text;
BEGIN
  -- default plan is free; pick ACTIVE subscription only
  SELECT COALESCE(s.plan_type::text, 'free') INTO v_plan
  FROM shop_subscriptions s
  WHERE s.shop_domain = p_shop AND s.status = 'active'
  ORDER BY s.updated_at DESC
  LIMIT 1;

  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;

  -- Define limits per plan (premium/unlimited => no limits)
  IF v_plan = 'free' THEN
    orders_limit := 70;
    abandoned_limit := 30;
  ELSIF v_plan = 'basic' THEN
    orders_limit := 1000;
    abandoned_limit := 30;
  ELSIF v_plan = 'premium' OR v_plan = 'unlimited' THEN
    orders_limit := NULL; -- unlimited
    abandoned_limit := NULL; -- unlimited
  ELSE
    orders_limit := 70; -- fallback to free
    abandoned_limit := 30;
  END IF;

  RETURN NEXT;
END;
$$;

-- 3) Confirm subscription payment should activate requested plan
CREATE OR REPLACE FUNCTION public.confirm_subscription_payment(p_shop_domain text, p_shopify_charge_id text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_requested public.subscription_plan;
BEGIN
  SELECT requested_plan_type INTO v_requested
  FROM shop_subscriptions
  WHERE shop_domain = p_shop_domain
  ORDER BY updated_at DESC
  LIMIT 1;

  UPDATE shop_subscriptions
  SET
    status = 'active',
    plan_type = COALESCE(v_requested, plan_type),
    requested_plan_type = NULL,
    requested_at = NULL,
    shopify_charge_id = COALESCE(p_shopify_charge_id, shopify_charge_id),
    subscription_started_at = now(),
    updated_at = now()
  WHERE shop_domain = p_shop_domain;

  RETURN jsonb_build_object('success', true);
END;
$$;

