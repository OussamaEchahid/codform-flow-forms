-- Fix SQL functions to avoid syntax error at GET DIAGNOSTICS with boolean comparison
-- and provide secure RPCs to manage quantity offers and form publication/deletion

-- 1) Upsert quantity offer (insert or update) and return id
CREATE OR REPLACE FUNCTION public.upsert_quantity_offer(
  p_shop_id text,
  p_form_id uuid,
  p_product_id text,
  p_offers jsonb,
  p_styling jsonb,
  p_enabled boolean DEFAULT true,
  p_position text DEFAULT 'before_form',
  p_custom_selector text DEFAULT NULL,
  p_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Ensure the shop exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM shopify_stores s WHERE s.shop = p_shop_id AND s.is_active = true
  ) THEN
    RAISE EXCEPTION 'SHOP_NOT_FOUND_OR_INACTIVE';
  END IF;

  IF p_id IS NOT NULL THEN
    UPDATE quantity_offers
    SET 
      offers = COALESCE(p_offers, offers),
      styling = COALESCE(p_styling, styling),
      enabled = COALESCE(p_enabled, enabled),
      position = COALESCE(p_position, position),
      custom_selector = COALESCE(p_custom_selector, custom_selector),
      updated_at = now()
    WHERE id = p_id AND shop_id = p_shop_id
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO quantity_offers (
      shop_id, form_id, product_id, offers, styling, enabled, position, custom_selector
    ) VALUES (
      p_shop_id, p_form_id, p_product_id,
      COALESCE(p_offers, '[]'::jsonb),
      COALESCE(p_styling, '{}'::jsonb),
      COALESCE(p_enabled, true),
      COALESCE(p_position, 'before_form'),
      p_custom_selector
    ) RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- 2) Delete a single quantity offer safely
CREATE OR REPLACE FUNCTION public.delete_quantity_offer(
  p_offer_id uuid,
  p_shop_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected integer;
BEGIN
  DELETE FROM quantity_offers WHERE id = p_offer_id AND shop_id = p_shop_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$;

-- 3) Set form publication state safely
CREATE OR REPLACE FUNCTION public.set_form_publication(
  p_form_id uuid,
  p_shop_id text,
  p_publish boolean
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE forms
  SET is_published = p_publish, updated_at = now()
  WHERE id = p_form_id AND (shop_id = p_shop_id OR p_shop_id IS NULL);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$;

-- 4) Delete form and related rows atomically
CREATE OR REPLACE FUNCTION public.delete_form_full(
  p_form_id uuid,
  p_shop_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected integer;
BEGIN
  -- Ensure store exists
  IF NOT EXISTS (SELECT 1 FROM shopify_stores WHERE shop = p_shop_id) THEN
    RAISE EXCEPTION 'SHOP_NOT_FOUND';
  END IF;

  -- Delete dependent rows first
  DELETE FROM shopify_product_settings WHERE form_id = p_form_id AND shop_id = p_shop_id;
  DELETE FROM quantity_offers WHERE form_id = p_form_id AND shop_id = p_shop_id;
  DELETE FROM shopify_form_insertion WHERE form_id = p_form_id AND shop_id = p_shop_id;

  -- Finally delete the form
  DELETE FROM forms WHERE id = p_form_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$;