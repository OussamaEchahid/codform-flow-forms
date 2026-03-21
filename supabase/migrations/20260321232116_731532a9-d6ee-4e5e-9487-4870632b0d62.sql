
-- Create subscription_plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'premium', 'unlimited');

-- shopify_stores
CREATE TABLE public.shopify_stores (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    shop text NOT NULL,
    access_token text,
    token_type text,
    scope text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    currency text,
    money_format text,
    money_with_currency_format text,
    user_id uuid,
    email text,
    country text,
    province text,
    timezone text
);

-- forms
CREATE TABLE public.forms (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    data jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    shop_id text,
    style jsonb,
    country text DEFAULT 'SA'::text,
    currency text DEFAULT 'SAR'::text,
    phone_prefix text DEFAULT '+966'::text,
    owner_user_id uuid
);

-- form_submissions
CREATE TABLE public.form_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    form_id text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    shop_id text,
    shopify_order_id text,
    shopify_order_name text,
    product_id text,
    variant_id text,
    quantity integer DEFAULT 1,
    total_price text,
    status text DEFAULT 'pending'::text,
    customer_email text,
    customer_phone text
);

-- shopify_product_settings
CREATE TABLE public.shopify_product_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    form_id uuid NOT NULL,
    product_id text NOT NULL,
    shop_id text NOT NULL,
    block_id text,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid
);

-- shopify_form_insertion
CREATE TABLE public.shopify_form_insertion (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    form_id uuid NOT NULL,
    shop_id text NOT NULL,
    position text NOT NULL,
    block_id text,
    theme_type text NOT NULL,
    insertion_method text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- quantity_offers
CREATE TABLE public.quantity_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    shop_id text NOT NULL,
    product_id text NOT NULL,
    form_id uuid NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    offers jsonb DEFAULT '[]'::jsonb NOT NULL,
    styling jsonb DEFAULT '{"tagColor": "#22c55e", "textColor": "#000000", "priceColor": "#ef4444", "backgroundColor": "#ffffff"}'::jsonb NOT NULL,
    position text DEFAULT 'before_form'::text NOT NULL,
    custom_selector text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid
);

-- blocked_countries
CREATE TABLE public.blocked_countries (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    shop_id text NOT NULL,
    user_id uuid NOT NULL,
    country_code text NOT NULL,
    country_name text NOT NULL,
    reason text,
    redirect_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- blocked_ips
CREATE TABLE public.blocked_ips (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ip_address text NOT NULL,
    shop_id text NOT NULL,
    user_id uuid,
    reason text,
    redirect_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- orders
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    order_number text NOT NULL,
    customer_name text,
    customer_email text,
    customer_phone text,
    total_amount numeric(10,2),
    currency text DEFAULT 'SAR'::text,
    status text DEFAULT 'pending'::text,
    items jsonb DEFAULT '[]'::jsonb,
    shipping_address jsonb DEFAULT '{}'::jsonb,
    billing_address jsonb DEFAULT '{}'::jsonb,
    form_id text,
    shop_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    shopify_order_id text,
    notes text,
    customer_address text,
    customer_city text,
    customer_country text,
    discount numeric(10,2) DEFAULT 0,
    shipping_cost numeric(10,2) DEFAULT 0,
    extras numeric(10,2) DEFAULT 0,
    ip_address text
);

-- order_settings
CREATE TABLE public.order_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    shop_id text NOT NULL,
    user_id uuid,
    post_order_action text DEFAULT 'redirect'::text NOT NULL,
    redirect_enabled boolean DEFAULT true NOT NULL,
    thank_you_page_url text,
    popup_title text DEFAULT 'Order Received'::text,
    popup_message text DEFAULT 'We will call you soon to confirm your order details.'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_status text DEFAULT 'pending'::text,
    payment_status_enabled boolean DEFAULT true,
    daily_order_limit integer DEFAULT 5,
    daily_order_limit_enabled boolean DEFAULT true,
    out_of_stock_message text DEFAULT 'Sorry, this product is currently out of stock'::text,
    out_of_stock_message_enabled boolean DEFAULT true
);

-- abandoned_carts
CREATE TABLE public.abandoned_carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    customer_email text,
    customer_phone text,
    cart_items jsonb DEFAULT '[]'::jsonb,
    total_value numeric(10,2),
    currency text DEFAULT 'SAR'::text,
    last_activity timestamp with time zone DEFAULT now(),
    form_id text,
    shop_id text,
    recovery_attempts integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_name text,
    form_data jsonb DEFAULT '{}'::jsonb
);

-- advertising_pixels
CREATE TABLE public.advertising_pixels (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    shop_id text NOT NULL,
    platform text NOT NULL,
    pixel_id text NOT NULL,
    name text NOT NULL,
    event_type text DEFAULT 'Lead'::text NOT NULL,
    target_type text DEFAULT 'All'::text NOT NULL,
    target_id text,
    enabled boolean DEFAULT true,
    conversion_api_enabled boolean DEFAULT false,
    access_token text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid
);

-- currency_display_settings
CREATE TABLE public.currency_display_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    show_symbol boolean DEFAULT true NOT NULL,
    symbol_position text DEFAULT 'before'::text NOT NULL,
    decimal_places integer DEFAULT 2 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    shop_id text NOT NULL
);

-- currency_settings
CREATE TABLE public.currency_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    shop_id text NOT NULL,
    shop_domain text NOT NULL,
    display_settings jsonb DEFAULT '{"show_symbol": true, "decimal_places": 0, "symbol_position": "before"}'::jsonb NOT NULL,
    custom_symbols jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- custom_currency_rates
CREATE TABLE public.custom_currency_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    currency_code text NOT NULL,
    exchange_rate numeric(15,8) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    shop_id text
);

-- custom_currency_symbols
CREATE TABLE public.custom_currency_symbols (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid,
    shop_id text,
    currency_code text NOT NULL,
    custom_symbol text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- google_oauth_tokens
CREATE TABLE public.google_oauth_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid,
    shop_id text,
    email text,
    access_token text NOT NULL,
    refresh_token text,
    token_type text,
    scope text,
    expiry timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- google_sheets_configs
CREATE TABLE public.google_sheets_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    sheet_id text NOT NULL,
    sheet_name text,
    webhook_url text,
    enabled boolean DEFAULT true,
    sync_orders boolean DEFAULT true,
    sync_submissions boolean DEFAULT false,
    shop_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    spreadsheet_id text,
    sheet_title text,
    spreadsheet_name text,
    columns_mapping jsonb
);

-- google_sheets_form_mappings
CREATE TABLE public.google_sheets_form_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    shop_id text NOT NULL,
    form_id text NOT NULL,
    spreadsheet_id text NOT NULL,
    sheet_id text,
    sheet_title text NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- shop_settings
CREATE TABLE public.shop_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    shop_domain text NOT NULL,
    notification_settings jsonb DEFAULT '{"enabled": false}'::jsonb,
    webhook_settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- shop_subscriptions
CREATE TABLE public.shop_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    shop_domain text NOT NULL,
    plan_type public.subscription_plan DEFAULT 'free'::public.subscription_plan NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    billing_cycle text DEFAULT 'monthly'::text,
    price_amount numeric(10,2) DEFAULT 0.00,
    currency text DEFAULT 'USD'::text,
    trial_days_remaining integer DEFAULT 0,
    trial_started_at timestamp with time zone,
    subscription_started_at timestamp with time zone DEFAULT now(),
    next_billing_date timestamp with time zone,
    shopify_charge_id text,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    requested_plan_type public.subscription_plan,
    requested_at timestamp with time zone,
    charge_type text DEFAULT 'live'::text
);

-- security_logs
CREATE TABLE public.security_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    shop_id text NOT NULL,
    blocked_type text NOT NULL,
    blocked_value text NOT NULL,
    action text NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- unified_default_rates
CREATE TABLE public.unified_default_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    currency_code text NOT NULL,
    exchange_rate numeric(15,4) NOT NULL,
    currency_name text NOT NULL,
    currency_symbol text NOT NULL,
    region text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.shopify_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_product_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_form_insertion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantity_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertising_pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_display_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_currency_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sheets_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sheets_form_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_default_rates ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Users can view their own stores" ON public.shopify_stores FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own stores" ON public.shopify_stores FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own stores" ON public.shopify_stores FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view their own forms" ON public.forms FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own forms" ON public.forms FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own forms" ON public.forms FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own forms" ON public.forms FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view submissions" ON public.form_submissions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Anyone can insert submissions" ON public.form_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Users can view product settings" ON public.shopify_product_settings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage product settings" ON public.shopify_product_settings FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view their orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update orders" ON public.orders FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can manage order settings" ON public.order_settings FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage blocked countries" ON public.blocked_countries FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage blocked ips" ON public.blocked_ips FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage quantity offers" ON public.quantity_offers FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage abandoned carts" ON public.abandoned_carts FOR ALL TO authenticated USING (true);
CREATE POLICY "Anyone can insert abandoned carts" ON public.abandoned_carts FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Users can manage advertising pixels" ON public.advertising_pixels FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage currency display" ON public.currency_display_settings FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage currency settings" ON public.currency_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage custom rates" ON public.custom_currency_rates FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage custom symbols" ON public.custom_currency_symbols FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Anyone can read default rates" ON public.unified_default_rates FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can manage google tokens" ON public.google_oauth_tokens FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage sheets configs" ON public.google_sheets_configs FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage sheets mappings" ON public.google_sheets_form_mappings FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can manage shop settings" ON public.shop_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage subscriptions" ON public.shop_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view security logs" ON public.security_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert security logs" ON public.security_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Public access for forms (needed for Shopify storefront)
CREATE POLICY "Anyone can view published forms" ON public.forms FOR SELECT TO anon USING (is_published = true);

-- Public access for form insertion and product settings (needed for storefront)
CREATE POLICY "Anyone can view form insertion" ON public.shopify_form_insertion FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can manage form insertion" ON public.shopify_form_insertion FOR ALL TO authenticated USING (true);

CREATE POLICY "Anyone can view product settings public" ON public.shopify_product_settings FOR SELECT TO anon USING (true);

-- Associate product with form function
CREATE OR REPLACE FUNCTION public.associate_product_with_form(
    p_shop_id text,
    p_product_id text,
    p_form_id text,
    p_block_id text DEFAULT NULL,
    p_enabled boolean DEFAULT true
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_result_id uuid;
BEGIN
    INSERT INTO shopify_product_settings (form_id, product_id, shop_id, block_id, enabled)
    VALUES (p_form_id::uuid, p_product_id, p_shop_id, p_block_id, p_enabled)
    ON CONFLICT (id) DO UPDATE SET
        form_id = EXCLUDED.form_id,
        product_id = EXCLUDED.product_id,
        enabled = EXCLUDED.enabled,
        updated_at = now()
    RETURNING id INTO v_result_id;
    
    RETURN v_result_id::text;
END;
$$;

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_blocked_countries(p_shop_id text) RETURNS SETOF public.blocked_countries
LANGUAGE sql SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT bc.* FROM public.blocked_countries bc WHERE bc.shop_id = p_shop_id AND bc.is_active = true ORDER BY bc.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_blocked_ips(p_shop_id text) RETURNS SETOF public.blocked_ips
LANGUAGE sql SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT bi.* FROM public.blocked_ips bi WHERE bi.shop_id = p_shop_id AND bi.is_active = true ORDER BY bi.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_form_quantity_offers(p_shop_id text, p_form_id uuid DEFAULT NULL) RETURNS SETOF public.quantity_offers
LANGUAGE sql SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT qo.* FROM public.quantity_offers qo WHERE qo.shop_id = p_shop_id AND (p_form_id IS NULL OR qo.form_id = p_form_id) ORDER BY qo.updated_at DESC;
$$;

-- update_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
