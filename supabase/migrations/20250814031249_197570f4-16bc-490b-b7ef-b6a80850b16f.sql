-- تعديل نوع عمود form_id ليكون text بدلاً من uuid
ALTER TABLE public.abandoned_carts 
ALTER COLUMN form_id TYPE text;