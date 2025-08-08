-- Fix broken function by recreating it with proper dollar-quoting and schema search_path
CREATE OR REPLACE FUNCTION public.get_form_quantity_offers(
  p_shop_id text,
  p_form_id uuid DEFAULT NULL
)
RETURNS SETOF public.quantity_offers
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT qo.*
  FROM public.quantity_offers qo
  WHERE qo.shop_id = p_shop_id
    AND (p_form_id IS NULL OR qo.form_id = p_form_id)
  ORDER BY qo.updated_at DESC, qo.created_at DESC;
$function$;