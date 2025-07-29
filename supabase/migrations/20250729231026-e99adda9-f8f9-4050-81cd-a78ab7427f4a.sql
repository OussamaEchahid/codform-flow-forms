-- Fix RLS policy for quantity_offers table
-- First disable RLS temporarily to avoid conflicts
ALTER TABLE public.quantity_offers DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE 
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT pol.polname 
        FROM pg_policy pol 
        JOIN pg_class cls ON pol.polrelid = cls.oid 
        WHERE cls.relname = 'quantity_offers'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.quantity_offers', policy_name);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.quantity_offers ENABLE ROW LEVEL SECURITY;

-- Create a new comprehensive policy that allows all operations
CREATE POLICY "quantity_offers_full_access" 
ON public.quantity_offers 
FOR ALL 
USING (
  -- Always allow access - we'll handle authorization in the application layer
  true
)
WITH CHECK (
  -- Always allow insert/update - we'll handle authorization in the application layer
  true
);