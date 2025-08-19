-- Update create_form_for_shop RPC function to support country_tag

DROP FUNCTION IF EXISTS public.create_form_for_shop(text, text, text, jsonb, jsonb, boolean, text, text, text);

CREATE OR REPLACE FUNCTION public.create_form_for_shop(
  p_shop_id text, 
  p_title text, 
  p_description text DEFAULT NULL::text, 
  p_data jsonb DEFAULT '[]'::jsonb, 
  p_style jsonb DEFAULT '{}'::jsonb, 
  p_is_published boolean DEFAULT false,
  p_country text DEFAULT NULL::text,
  p_currency text DEFAULT NULL::text, 
  p_phone_prefix text DEFAULT NULL::text,
  p_country_tag text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_form_id uuid;
BEGIN
  -- Determine the user to own the form
  SELECT COALESCE(auth.uid(), s.user_id, '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid)
    INTO v_user_id
  FROM shopify_stores s
  WHERE s.shop = p_shop_id
  ORDER BY s.updated_at DESC
  LIMIT 1;

  -- Fallback if no store row exists
  IF v_user_id IS NULL THEN
    v_user_id := COALESCE(auth.uid(), '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid);
  END IF;

  INSERT INTO forms (
    title,
    description,
    data,
    is_published,
    user_id,
    style,
    shop_id,
    country,
    currency,
    phone_prefix,
    country_tag
  ) VALUES (
    p_title,
    p_description,
    COALESCE(p_data, '[]'::jsonb),
    COALESCE(p_is_published, false),
    v_user_id,
    COALESCE(p_style, '{}'::jsonb),
    p_shop_id,
    p_country,
    p_currency,
    p_phone_prefix,
    COALESCE(p_country_tag, p_country) -- استخدام country كافتراضي إذا لم يتم تمرير country_tag
  ) RETURNING id INTO v_form_id;

  RETURN v_form_id;
END;
$function$;
