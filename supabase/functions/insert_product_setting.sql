
-- Function to insert or update product settings
CREATE OR REPLACE FUNCTION insert_product_setting(
  p_shop_id text,
  p_product_id text,
  p_form_id uuid,
  p_enabled boolean,
  p_block_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Insert or update product settings
  INSERT INTO product_settings (
    shop_id,
    product_id,
    form_id,
    enabled,
    block_id,
    updated_at
  )
  VALUES (
    p_shop_id,
    p_product_id,
    p_form_id,
    p_enabled,
    p_block_id,
    now()
  )
  ON CONFLICT (shop_id, product_id)
  DO UPDATE SET
    form_id = p_form_id,
    enabled = p_enabled,
    block_id = COALESCE(p_block_id, product_settings.block_id),
    updated_at = now();
END;
$$;
