
CREATE OR REPLACE FUNCTION public.insert_product_setting(
  p_shop_id TEXT,
  p_product_id TEXT,
  p_form_id UUID,
  p_enabled BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.shopify_product_settings (
    shop_id,
    product_id,
    form_id,
    enabled,
    updated_at
  ) VALUES (
    p_shop_id,
    p_product_id,
    p_form_id,
    p_enabled,
    now()
  )
  ON CONFLICT (shop_id, product_id) 
  DO UPDATE SET
    form_id = p_form_id,
    enabled = p_enabled,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
