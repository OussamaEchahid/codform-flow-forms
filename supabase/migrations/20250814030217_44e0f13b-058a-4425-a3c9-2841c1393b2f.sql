-- إضافة العمود المفقود customer_name لجدول abandoned_carts
ALTER TABLE public.abandoned_carts 
ADD COLUMN IF NOT EXISTS customer_name text;