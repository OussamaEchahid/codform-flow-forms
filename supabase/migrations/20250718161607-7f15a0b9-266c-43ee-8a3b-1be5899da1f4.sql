-- Fix security issues by setting search_path for functions
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.associate_product_with_form(TEXT, TEXT, UUID, TEXT, BOOLEAN) SET search_path = '';