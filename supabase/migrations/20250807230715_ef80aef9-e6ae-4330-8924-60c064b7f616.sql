-- Create SECURITY DEFINER function to create a form for a shop while respecting ownership
CREATE OR REPLACE FUNCTION public.create_form_for_shop(
  p_shop_id text,
  p_title text,
  p_description text DEFAULT NULL,
  p_data jsonb DEFAULT '[]'::jsonb,
  p_style jsonb DEFAULT '{}'::jsonb,
  p_is_published boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    shop_id
  ) VALUES (
    p_title,
    p_description,
    COALESCE(p_data, '[]'::jsonb),
    COALESCE(p_is_published, false),
    v_user_id,
    COALESCE(p_style, '{}'::jsonb),
    p_shop_id
  ) RETURNING id INTO v_form_id;

  RETURN v_form_id;
END;
$$;

-- Allow public read access to product associations of published forms
DROP POLICY IF EXISTS "Public can view product settings for published forms" ON public.shopify_product_settings;
CREATE POLICY "Public can view product settings for published forms"
ON public.shopify_product_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = shopify_product_settings.form_id
      AND f.is_published = true
  )
);
