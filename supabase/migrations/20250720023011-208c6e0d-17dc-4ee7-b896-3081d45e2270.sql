-- تحويل عمود form_id في جدول orders من UUID إلى TEXT لتوافق مع form_submissions
ALTER TABLE public.orders 
ALTER COLUMN form_id TYPE text;