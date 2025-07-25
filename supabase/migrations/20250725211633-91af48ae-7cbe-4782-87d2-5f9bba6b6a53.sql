-- Fix the user linkage for existing stores
-- Link stores to the current authenticated user based on active store in localStorage
UPDATE shopify_stores 
SET user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'
WHERE shop = 'bestform-app.myshopify.com' 
  AND user_id IS NULL;

-- Create function to automatically link stores to users
CREATE OR REPLACE FUNCTION public.link_active_store_to_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Link stores that are active but not linked to any user to the current authenticated user
  IF auth.uid() IS NOT NULL THEN
    UPDATE shopify_stores 
    SET user_id = auth.uid(), 
        updated_at = now()
    WHERE user_id IS NULL 
      AND is_active = true
      AND access_token IS NOT NULL
      AND access_token != ''
      AND access_token != 'placeholder_token';
    
    RAISE NOTICE 'Linked active stores to user %', auth.uid();
  END IF;
END;
$function$;