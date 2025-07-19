-- إسقاط جميع السياسات الحالية لجدول النماذج
DROP POLICY IF EXISTS "Allow reading forms for authenticated users and shops" ON public.forms;
DROP POLICY IF EXISTS "Users can create their own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can update their own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can delete their own forms" ON public.forms;

-- إنشاء سياسات جديدة تعتمد على shop_id بدلاً من المصادقة
CREATE POLICY "Allow reading forms by shop_id" 
ON public.forms 
FOR SELECT 
USING (shop_id IS NOT NULL);

CREATE POLICY "Allow creating forms by shop_id" 
ON public.forms 
FOR INSERT 
WITH CHECK (shop_id IS NOT NULL);

CREATE POLICY "Allow updating forms by shop_id" 
ON public.forms 
FOR UPDATE 
USING (shop_id IS NOT NULL);

CREATE POLICY "Allow deleting forms by shop_id" 
ON public.forms 
FOR DELETE 
USING (shop_id IS NOT NULL);

-- تحديث سياسات إدارة متاجر Shopify
DROP POLICY IF EXISTS "Users can manage their Shopify stores" ON public.shopify_stores;
CREATE POLICY "Allow managing Shopify stores" 
ON public.shopify_stores 
FOR ALL 
USING (true);

-- تحديث سياسات إعدادات المنتجات
DROP POLICY IF EXISTS "Users can manage Shopify product settings" ON public.shopify_product_settings;
CREATE POLICY "Allow managing Shopify product settings" 
ON public.shopify_product_settings 
FOR ALL 
USING (true);

-- تحديث سياسات إدراج النماذج
DROP POLICY IF EXISTS "Users can manage Shopify form insertions" ON public.shopify_form_insertion;
CREATE POLICY "Allow managing Shopify form insertions" 
ON public.shopify_form_insertion 
FOR ALL 
USING (true);