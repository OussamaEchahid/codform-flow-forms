-- Fix 42P13 error by removing invalid function signature and recreating with required params first
-- Drop the faulty overloaded version (had defaults before required params)
DROP FUNCTION IF EXISTS public.upsert_quantity_offer(
  uuid, text, uuid, text, jsonb, jsonb, boolean, text, text
);

-- Create the correct version: required params first, then optional with defaults
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
SET search_path = public
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

    -- If no row was updated (e.g., id does not match the shop), fall back to insert
    IF v_id IS NULL THEN
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

-- Ensure permissions
REVOKE ALL ON FUNCTION public.upsert_quantity_offer(text, uuid, text, jsonb, jsonb, boolean, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_quantity_offer(text, uuid, text, jsonb, jsonb, boolean, text, text, uuid) TO authenticated, anon;