-- Fix form_submissions security vulnerabilities

-- Drop existing potentially problematic policies
DROP POLICY IF EXISTS "allow_form_submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Owners view form submissions" ON public.form_submissions;

-- Create more secure policy for viewing submissions
-- Only allow shop owners OR form owners to view submissions
CREATE POLICY "Shop and form owners can view submissions" 
ON public.form_submissions 
FOR SELECT 
TO authenticated
USING (
  -- User owns the shop where submission was made
  (shop_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shopify_stores s 
    WHERE s.shop = form_submissions.shop_id 
    AND s.user_id = auth.uid()
    AND s.is_active = true
  ))
  OR 
  -- User owns the form that was submitted to
  (form_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.forms f 
    WHERE f.id::text = form_submissions.form_id 
    AND f.user_id = auth.uid()
  ))
);

-- Create secure policy for form submissions
-- Only allow submissions to published forms with valid shop context
CREATE POLICY "Allow secure form submissions" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (
  -- Form must be published
  form_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.forms f 
    WHERE f.id::text = form_submissions.form_id 
    AND f.is_published = true
  )
  -- Shop must be active if shop_id is provided
  AND (
    shop_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.shopify_stores s 
      WHERE s.shop = form_submissions.shop_id 
      AND s.is_active = true
    )
  )
);

-- Prevent unauthorized updates to submissions
CREATE POLICY "Prevent unauthorized submission updates" 
ON public.form_submissions 
FOR UPDATE 
TO authenticated
USING (false); -- No updates allowed to maintain data integrity

-- Allow shop/form owners to delete submissions if needed
CREATE POLICY "Owners can delete submissions" 
ON public.form_submissions 
FOR DELETE 
TO authenticated
USING (
  -- User owns the shop where submission was made
  (shop_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shopify_stores s 
    WHERE s.shop = form_submissions.shop_id 
    AND s.user_id = auth.uid()
    AND s.is_active = true
  ))
  OR 
  -- User owns the form that was submitted to
  (form_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.forms f 
    WHERE f.id::text = form_submissions.form_id 
    AND f.user_id = auth.uid()
  ))
);