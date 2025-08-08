-- Create a safe public function to list quantity offers without RLS friction
-- Avoid using reserved-like identifiers in RETURNS TABLE by returning SETOF the table type
CREATE OR REPLACE FUNCTION public.get_form_quantity_offers(
  p_shop_id text,
  p_form_id uuid DEFAULT NULL
)
RETURNS SETOF public.quantity_offers
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT qo.*
  FROM public.quantity_offers qo
  WHERE qo.shop_id = p_shop_id
    AND (p_form_id IS NULL OR qo.form_id = p_form_id)
  ORDER BY qo.updated_at DESC, qo.created_at DESC;
$$;

-- Grant execute to web roles
REVOKE ALL ON FUNCTION public.get_form_quantity_offers(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_form_quantity_offers(text, uuid) TO anon, authenticated;
