-- Create function to get user stores
CREATE OR REPLACE FUNCTION get_user_stores(p_user_id uuid)
RETURNS TABLE (
  shop text,
  is_active boolean,
  updated_at timestamp with time zone,
  access_token text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    s.shop,
    s.is_active,
    s.updated_at,
    s.access_token
  FROM shopify_stores s
  WHERE s.user_id = p_user_id
  ORDER BY s.updated_at DESC;
END;
$$;