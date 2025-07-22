-- First, let's check if the quantity_offers table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS public.quantity_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  offer_text TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  position TEXT NOT NULL DEFAULT 'before_form' CHECK (position IN ('before_form', 'inside_form', 'after_form')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint to forms table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'quantity_offers_form_id_fkey'
  ) THEN
    ALTER TABLE public.quantity_offers 
    ADD CONSTRAINT quantity_offers_form_id_fkey 
    FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.quantity_offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quantity_offers
DROP POLICY IF EXISTS "Allow public read access to quantity_offers" ON public.quantity_offers;
CREATE POLICY "Allow public read access to quantity_offers" 
ON public.quantity_offers 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage quantity_offers" ON public.quantity_offers;
CREATE POLICY "Allow authenticated users to manage quantity_offers" 
ON public.quantity_offers 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quantity_offers_form_id ON public.quantity_offers(form_id);
CREATE INDEX IF NOT EXISTS idx_quantity_offers_product_id ON public.quantity_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_quantity_offers_shop_id ON public.quantity_offers(shop_id);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_quantity_offers_updated_at ON public.quantity_offers;
CREATE TRIGGER update_quantity_offers_updated_at
BEFORE UPDATE ON public.quantity_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();