-- Plan limits and enforcement triggers
-- 1) Helper: get_shop_limits
CREATE OR REPLACE FUNCTION public.get_shop_limits(p_shop text)
RETURNS TABLE(orders_limit integer, abandoned_limit integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan text;
BEGIN
  -- default plan is free
  SELECT COALESCE(s.plan_type::text, 'free') INTO v_plan
  FROM shop_subscriptions s
  WHERE s.shop_domain = p_shop
  ORDER BY s.updated_at DESC
  LIMIT 1;

  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;

  -- Define limits per plan (premium and unlimited => no limits)
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

-- 2) Trigger: enforce orders monthly quota
CREATE OR REPLACE FUNCTION public.enforce_orders_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_orders_limit integer;
  v_abandoned_limit integer; -- not used here
  v_count integer;
BEGIN
  -- Only enforce when shop_id present
  IF NEW.shop_id IS NULL OR NEW.shop_id = '' THEN
    RETURN NEW;
  END IF;

  SELECT orders_limit, abandoned_limit INTO v_orders_limit, v_abandoned_limit
  FROM public.get_shop_limits(NEW.shop_id);

  -- If unlimited, allow
  IF v_orders_limit IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.orders o
  WHERE o.shop_id = NEW.shop_id
    AND date_trunc('month', o.created_at) = date_trunc('month', now());

  IF v_count >= v_orders_limit THEN
    RAISE EXCEPTION 'ORDERS_LIMIT_REACHED: Monthly limit % reached for shop %', v_orders_limit, NEW.shop_id
      USING HINT = 'Upgrade your plan to increase monthly order limits.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_before_insert_orders_quota ON public.orders;
CREATE TRIGGER trg_before_insert_orders_quota
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_orders_quota();

-- 3) Trigger: enforce abandoned carts monthly quota
CREATE OR REPLACE FUNCTION public.enforce_abandoned_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_orders_limit integer; -- not used here
  v_abandoned_limit integer;
  v_count integer;
BEGIN
  -- Only enforce when shop_id present
  IF NEW.shop_id IS NULL OR NEW.shop_id = '' THEN
    RETURN NEW;
  END IF;

  SELECT orders_limit, abandoned_limit INTO v_orders_limit, v_abandoned_limit
  FROM public.get_shop_limits(NEW.shop_id);

  -- If unlimited, allow
  IF v_abandoned_limit IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.abandoned_carts ac
  WHERE ac.shop_id = NEW.shop_id
    AND date_trunc('month', ac.created_at) = date_trunc('month', now());

  IF v_count >= v_abandoned_limit THEN
    RAISE EXCEPTION 'ABANDONED_LIMIT_REACHED: Monthly limit % reached for shop %', v_abandoned_limit, NEW.shop_id
      USING HINT = 'Upgrade your plan to increase abandoned checkouts limit.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_before_insert_abandoned_quota ON public.abandoned_carts;
CREATE TRIGGER trg_before_insert_abandoned_quota
BEFORE INSERT ON public.abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_abandoned_quota();