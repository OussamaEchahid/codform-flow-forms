-- Create order_settings table for storing shop-specific order settings
CREATE TABLE IF NOT EXISTS public.order_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL,
  user_id UUID,
  post_order_action TEXT NOT NULL DEFAULT 'redirect',
  redirect_enabled BOOLEAN NOT NULL DEFAULT true,
  thank_you_page_url TEXT,
  popup_title TEXT DEFAULT 'Order Created Successfully!',
  popup_message TEXT DEFAULT 'Thank you for your order! We''ll contact you soon to confirm the details. Please keep your phone nearby.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id)
);

-- Enable RLS on order_settings
ALTER TABLE public.order_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for order_settings
CREATE POLICY "Users can view their shop order settings" 
ON public.order_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = order_settings.shop_id 
    AND shopify_stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create order settings for their shops" 
ON public.order_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = order_settings.shop_id 
    AND shopify_stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their shop order settings" 
ON public.order_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shopify_stores.shop = order_settings.shop_id 
    AND shopify_stores.user_id = auth.uid()
  )
);

-- Create trigger for updating the updated_at column
CREATE TRIGGER update_order_settings_updated_at
BEFORE UPDATE ON public.order_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();