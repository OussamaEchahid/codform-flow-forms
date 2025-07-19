-- Create orders table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text NOT NULL,
  customer_name text,
  customer_email text,
  customer_phone text,
  total_amount decimal(10,2),
  currency text DEFAULT 'SAR',
  status text DEFAULT 'pending',
  items jsonb DEFAULT '[]'::jsonb,
  shipping_address jsonb DEFAULT '{}'::jsonb,
  billing_address jsonb DEFAULT '{}'::jsonb,
  form_id uuid,
  shop_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can view all orders" 
ON public.orders 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update orders" 
ON public.orders 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create abandoned carts table
CREATE TABLE public.abandoned_carts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email text,
  customer_phone text,
  cart_items jsonb DEFAULT '[]'::jsonb,
  total_value decimal(10,2),
  currency text DEFAULT 'SAR',
  last_activity timestamp with time zone DEFAULT now(),
  form_id uuid,
  shop_id text,
  recovery_attempts integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for abandoned carts
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Create policies for abandoned carts
CREATE POLICY "Users can view all abandoned carts" 
ON public.abandoned_carts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create abandoned carts" 
ON public.abandoned_carts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update abandoned carts" 
ON public.abandoned_carts 
FOR UPDATE 
USING (true);

-- Create trigger for abandoned carts
CREATE TRIGGER update_abandoned_carts_updated_at
BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create google sheets integration table
CREATE TABLE public.google_sheets_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id text NOT NULL,
  sheet_name text,
  webhook_url text,
  enabled boolean DEFAULT true,
  sync_orders boolean DEFAULT true,
  sync_submissions boolean DEFAULT false,
  shop_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for google sheets configs
ALTER TABLE public.google_sheets_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for google sheets configs
CREATE POLICY "Users can manage google sheets configs" 
ON public.google_sheets_configs 
FOR ALL 
USING (true);