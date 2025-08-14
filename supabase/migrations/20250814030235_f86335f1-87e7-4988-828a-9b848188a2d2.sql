-- إضافة العمود المفقود form_data لجدول abandoned_carts
ALTER TABLE public.abandoned_carts 
ADD COLUMN IF NOT EXISTS form_data jsonb DEFAULT '{}'::jsonb;