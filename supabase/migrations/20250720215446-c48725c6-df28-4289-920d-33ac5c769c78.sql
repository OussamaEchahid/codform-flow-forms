-- Create quantity_offers table
CREATE TABLE public.quantity_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  form_id UUID NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  offers JSONB NOT NULL DEFAULT '[]'::jsonb,
  styling JSONB NOT NULL DEFAULT '{
    "backgroundColor": "#ffffff",
    "textColor": "#000000", 
    "tagColor": "#22c55e",
    "priceColor": "#ef4444"
  }'::jsonb,
  position TEXT NOT NULL DEFAULT 'before_form',
  custom_selector TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quantity_offers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow managing quantity offers" 
ON public.quantity_offers 
FOR ALL 
USING (true);

-- Create trigger for timestamps
CREATE TRIGGER update_quantity_offers_updated_at
BEFORE UPDATE ON public.quantity_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();