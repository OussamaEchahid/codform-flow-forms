-- إسقاط جميع السياسات الحالية لجدول النماذج بأسمائها الصحيحة
DROP POLICY IF EXISTS "Allow reading forms for authenticated users and shops" ON public.forms;
DROP POLICY IF EXISTS "Users can create their own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can update their own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can delete their own forms" ON public.forms;

-- إنشاء سياسات جديدة تعتمد على shop_id بدلاً من المصادقة  
CREATE POLICY "Allow reading forms by shop" 
ON public.forms 
FOR SELECT 
USING (shop_id IS NOT NULL);

CREATE POLICY "Allow creating forms by shop" 
ON public.forms 
FOR INSERT 
WITH CHECK (shop_id IS NOT NULL);

CREATE POLICY "Allow updating forms by shop" 
ON public.forms 
FOR UPDATE 
USING (shop_id IS NOT NULL);

CREATE POLICY "Allow deleting forms by shop" 
ON public.forms 
FOR DELETE 
USING (shop_id IS NOT NULL);