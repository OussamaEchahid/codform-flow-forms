-- Ensure quota enforcement triggers exist for orders and abandoned carts
DO $$
BEGIN
  -- Orders quota trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_orders_quota_before_insert'
  ) THEN
    CREATE TRIGGER enforce_orders_quota_before_insert
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_orders_quota();
  END IF;

  -- Abandoned carts quota trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_abandoned_quota_before_insert'
  ) THEN
    CREATE TRIGGER enforce_abandoned_quota_before_insert
    BEFORE INSERT ON public.abandoned_carts
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_abandoned_quota();
  END IF;
END $$;

-- Helpful indexes for monthly quota checks (idempotent)
CREATE INDEX IF NOT EXISTS idx_orders_shop_month ON public.orders (shop_id, created_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_shop_month ON public.abandoned_carts (shop_id, created_at);
