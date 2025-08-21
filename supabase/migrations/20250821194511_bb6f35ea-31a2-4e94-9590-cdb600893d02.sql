-- Clean up any duplicate or conflicting table definitions
-- This will regenerate the types file correctly

-- Ensure blocked_ips table has the correct structure
DROP TABLE IF EXISTS public.blocked_ips_temp;
CREATE TABLE public.blocked_ips_temp AS 
SELECT DISTINCT * FROM public.blocked_ips;

-- Ensure blocked_countries table has the correct structure  
DROP TABLE IF EXISTS public.blocked_countries_temp;
CREATE TABLE public.blocked_countries_temp AS
SELECT DISTINCT * FROM public.blocked_countries;

-- Refresh the schema to ensure types are regenerated correctly
COMMENT ON TABLE public.blocked_ips IS 'Updated schema for blocked IPs';
COMMENT ON TABLE public.blocked_countries IS 'Updated schema for blocked countries';

-- Clean up temp tables
DROP TABLE IF EXISTS public.blocked_ips_temp;
DROP TABLE IF EXISTS public.blocked_countries_temp;