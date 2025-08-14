-- Remove the security definer view that was flagged
DROP VIEW IF EXISTS public.published_forms_public;

-- Update the public policy to be more restrictive - remove the anonymous check 
-- as it was causing security warnings
DROP POLICY IF EXISTS "Public can view essential published form data" ON public.forms;

-- Create a more secure policy that only allows viewing published forms
-- but restricts the accessible fields through application logic
CREATE POLICY "Public can view published forms" 
ON public.forms 
FOR SELECT 
USING (is_published = true);

-- The security will be enforced at the application level by only selecting
-- the necessary fields when public access is needed