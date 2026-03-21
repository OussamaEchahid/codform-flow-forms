
-- Fix security_logs to match backup schema
DROP TABLE IF EXISTS public.security_logs;
CREATE TABLE public.security_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    shop_id text NOT NULL,
    blocked_type text NOT NULL,
    blocked_value text NOT NULL,
    visitor_ip text,
    visitor_country text,
    user_agent text,
    referer text,
    blocked_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view security logs" ON public.security_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert security logs" ON public.security_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Fix currency_display_settings - backup doesn't have id column, need to add it
ALTER TABLE public.currency_display_settings ALTER COLUMN id SET DEFAULT gen_random_uuid();
