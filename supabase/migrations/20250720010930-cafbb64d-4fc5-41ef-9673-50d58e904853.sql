-- Add shopify_order_id column to orders table to track Shopify orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shopify_order_id TEXT;