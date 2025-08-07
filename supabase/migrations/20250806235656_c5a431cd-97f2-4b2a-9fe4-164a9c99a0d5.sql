-- Create advertising_pixels table for tracking pixels
CREATE TABLE public.advertising_pixels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'snapchat', 'tiktok')),
  pixel_id TEXT NOT NULL,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'Lead' CHECK (event_type IN ('Lead', 'Purchase')),
  target_type TEXT NOT NULL DEFAULT 'All' CHECK (target_type IN ('All', 'Collection', 'Product')),
  target_id TEXT,
  enabled BOOLEAN DEFAULT true,
  conversion_api_enabled BOOLEAN DEFAULT false,
  access_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.advertising_pixels ENABLE ROW LEVEL SECURITY;

-- Create policies for advertising_pixels
CREATE POLICY "Users can view pixels for their shops" 
ON public.advertising_pixels 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = advertising_pixels.shop_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create pixels for their shops" 
ON public.advertising_pixels 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = advertising_pixels.shop_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update pixels for their shops" 
ON public.advertising_pixels 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = advertising_pixels.shop_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete pixels for their shops" 
ON public.advertising_pixels 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = advertising_pixels.shop_id 
    AND user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_advertising_pixels_updated_at
BEFORE UPDATE ON public.advertising_pixels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_advertising_pixels_shop_id ON public.advertising_pixels(shop_id);
CREATE INDEX idx_advertising_pixels_platform ON public.advertising_pixels(platform);
CREATE INDEX idx_advertising_pixels_enabled ON public.advertising_pixels(enabled);