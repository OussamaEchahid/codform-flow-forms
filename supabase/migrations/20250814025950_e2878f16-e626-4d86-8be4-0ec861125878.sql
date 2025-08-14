-- إضافة policy للسماح للعامة بإنشاء abandoned carts من خلال edge functions
CREATE POLICY "allow_public_abandoned_cart_creation"
ON public.abandoned_carts
FOR INSERT
WITH CHECK (true);

-- إضافة policy للسماح للعامة بتحديث abandoned carts من خلال edge functions  
CREATE POLICY "allow_public_abandoned_cart_updates"
ON public.abandoned_carts
FOR UPDATE
USING (true);