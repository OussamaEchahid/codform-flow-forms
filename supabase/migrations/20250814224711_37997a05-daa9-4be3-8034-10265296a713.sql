-- Remove the overly permissive public policy
DROP POLICY IF EXISTS "Public can view published forms" ON public.forms;

-- Create a security definer function that returns only essential form data for public access
CREATE OR REPLACE FUNCTION public.get_public_form_data(p_form_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  data jsonb,
  style jsonb,
  currency text,
  phone_prefix text,
  country text
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  -- Only return basic form rendering data for published forms
  RETURN QUERY
  SELECT 
    f.id,
    f.title,
    f.description,
    f.data,
    f.style,
    f.currency,
    f.phone_prefix,
    f.country
  FROM forms f
  WHERE f.id = p_form_id 
    AND f.is_published = true;
END;
$$;

-- Create a restricted public view for published forms (alternative approach)
CREATE OR REPLACE VIEW public.published_forms_public AS
SELECT 
  id,
  title,
  description,
  data,
  style,
  currency,
  phone_prefix,
  country,
  is_published,
  created_at,
  updated_at
FROM forms 
WHERE is_published = true;

-- Enable RLS on the view
ALTER VIEW public.published_forms_public SET (security_barrier = true);

-- Create a new restricted policy for public form access
CREATE POLICY "Public can view essential published form data" 
ON public.forms 
FOR SELECT 
USING (
  is_published = true 
  AND auth.uid() IS NULL -- Only for anonymous users
);

-- Grant access to the public function
GRANT EXECUTE ON FUNCTION public.get_public_form_data(uuid) TO anon;
GRANT SELECT ON public.published_forms_public TO anon;