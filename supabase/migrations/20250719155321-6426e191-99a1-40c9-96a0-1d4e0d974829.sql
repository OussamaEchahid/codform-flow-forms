-- إيقاف RLS مؤقتاً لحذف جميع السياسات
ALTER TABLE public.forms DISABLE ROW LEVEL SECURITY;

-- إعادة تشغيل RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة واحدة شاملة تسمح بجميع العمليات للنماذج التي لها shop_id
CREATE POLICY "forms_shop_access" 
ON public.forms 
FOR ALL
USING (shop_id IS NOT NULL)
WITH CHECK (shop_id IS NOT NULL);