-- Create forms table
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  shop_id TEXT,
  style JSONB
);

-- Create form submissions table
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID
);

-- Create Shopify stores table
CREATE TABLE public.shopify_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop TEXT NOT NULL UNIQUE,
  access_token TEXT,
  token_type TEXT,
  scope TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Shopify product settings table
CREATE TABLE public.shopify_product_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  block_id TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Shopify form insertion table
CREATE TABLE public.shopify_form_insertion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  shop_id TEXT NOT NULL,
  position TEXT NOT NULL,
  block_id TEXT,
  theme_type TEXT NOT NULL,
  insertion_method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_product_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_form_insertion ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for forms table
CREATE POLICY "Users can view their own forms" 
ON public.forms 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own forms" 
ON public.forms 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own forms" 
ON public.forms 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own forms" 
ON public.forms 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create RLS policies for form submissions
CREATE POLICY "Users can view submissions for their forms" 
ON public.form_submissions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE forms.id = form_submissions.form_id 
  AND forms.user_id::text = auth.uid()::text
));

CREATE POLICY "Anyone can create form submissions" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for Shopify tables
CREATE POLICY "Users can manage their Shopify stores" 
ON public.shopify_stores 
FOR ALL 
USING (true);

CREATE POLICY "Users can manage Shopify product settings" 
ON public.shopify_product_settings 
FOR ALL 
USING (true);

CREATE POLICY "Users can manage Shopify form insertions" 
ON public.shopify_form_insertion 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopify_stores_updated_at
  BEFORE UPDATE ON public.shopify_stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopify_product_settings_updated_at
  BEFORE UPDATE ON public.shopify_product_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopify_form_insertion_updated_at
  BEFORE UPDATE ON public.shopify_form_insertion
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for associating products with forms
CREATE OR REPLACE FUNCTION public.associate_product_with_form(
  p_shop_id TEXT,
  p_product_id TEXT,
  p_form_id UUID,
  p_block_id TEXT DEFAULT NULL,
  p_enabled BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO public.shopify_product_settings (
    form_id, product_id, shop_id, block_id, enabled
  ) VALUES (
    p_form_id, p_product_id, p_shop_id, p_block_id, p_enabled
  ) RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;