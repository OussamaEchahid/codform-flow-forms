-- Drop all existing RLS policies that might have casting issues
DROP POLICY IF EXISTS "users_manage_own_forms" ON forms;
DROP POLICY IF EXISTS "allow_anonymous_view_published_forms" ON forms;
DROP POLICY IF EXISTS "public_view_published_forms" ON forms;
DROP POLICY IF EXISTS "users_manage_own_settings" ON shopify_product_settings;
DROP POLICY IF EXISTS "users_manage_own_offers" ON quantity_offers;
DROP POLICY IF EXISTS "authenticated_users_view_submissions_for_forms" ON form_submissions;
DROP POLICY IF EXISTS "allow_form_submissions" ON form_submissions;
DROP POLICY IF EXISTS "allow_public_form_submissions" ON form_submissions;

-- Recreate policies with proper type casting
CREATE POLICY "users_manage_own_forms" ON forms
FOR ALL 
USING (
  CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE (auth.uid()::text = user_id::text)
  END
)
WITH CHECK (
  CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE (auth.uid()::text = user_id::text)
  END
);

CREATE POLICY "allow_anonymous_view_published_forms" ON forms
FOR SELECT 
USING (is_published = true);

CREATE POLICY "public_view_published_forms" ON forms
FOR SELECT 
USING (is_published = true);

CREATE POLICY "users_manage_own_settings" ON shopify_product_settings
FOR ALL 
USING (
  CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE (auth.uid()::text = user_id::text)
  END
)
WITH CHECK (
  CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE (auth.uid()::text = user_id::text)
  END
);

CREATE POLICY "users_manage_own_offers" ON quantity_offers
FOR ALL 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "authenticated_users_view_submissions_for_forms" ON form_submissions
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM forms
    WHERE forms.id::text = form_submissions.form_id
    AND forms.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "allow_form_submissions" ON form_submissions
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM forms
    WHERE forms.id::text = form_submissions.form_id
    AND forms.is_published = true
  )
);

CREATE POLICY "allow_public_form_submissions" ON form_submissions
FOR INSERT 
WITH CHECK (true);