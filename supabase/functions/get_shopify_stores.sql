
CREATE OR REPLACE FUNCTION public.get_user_shop()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Try to get the shop from shopify_stores table
  RETURN (
    SELECT shop
    FROM public.shopify_stores
    LIMIT 1
  );
END;
$function$;
