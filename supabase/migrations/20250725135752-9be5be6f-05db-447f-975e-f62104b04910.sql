-- إضافة user_id إلى جدول shopify_stores لربط كل متجر بمالكه
ALTER TABLE public.shopify_stores 
ADD COLUMN user_id UUID;

-- إضافة مؤشر لتحسين الأداء
CREATE INDEX idx_shopify_stores_user_id ON public.shopify_stores(user_id);

-- تحديث RLS policies لحماية البيانات
DROP POLICY IF EXISTS "Allow managing Shopify stores" ON public.shopify_stores;

-- سياسة للقراءة: المستخدمون يمكنهم رؤية متاجرهم فقط
CREATE POLICY "Users can view their own stores" 
ON public.shopify_stores 
FOR SELECT 
USING (auth.uid() = user_id);

-- سياسة للإدراج: المستخدمون يمكنهم إضافة متاجر لأنفسهم فقط
CREATE POLICY "Users can insert their own stores" 
ON public.shopify_stores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- سياسة للتحديث: المستخدمون يمكنهم تحديث متاجرهم فقط
CREATE POLICY "Users can update their own stores" 
ON public.shopify_stores 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- سياسة للحذف: المستخدمون يمكنهم حذف متاجرهم فقط
CREATE POLICY "Users can delete their own stores" 
ON public.shopify_stores 
FOR DELETE 
USING (auth.uid() = user_id);

-- تحديث الجداول الأخرى لتشمل user_id
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS owner_user_id UUID;

ALTER TABLE public.shopify_product_settings 
ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.quantity_offers 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- مؤشرات للأداء
CREATE INDEX IF NOT EXISTS idx_forms_owner_user_id ON public.forms(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shopify_product_settings_user_id ON public.shopify_product_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_quantity_offers_user_id ON public.quantity_offers(user_id);

-- تحديث RLS policies للجداول الأخرى
DROP POLICY IF EXISTS "Enable read access for all users" ON public.forms;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.forms;
DROP POLICY IF EXISTS "Enable update for all users" ON public.forms;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.forms;

-- سياسات جديدة للنماذج
CREATE POLICY "Users can view their own forms" 
ON public.forms 
FOR SELECT 
USING (auth.uid() = owner_user_id OR owner_user_id IS NULL);

CREATE POLICY "Users can insert their own forms" 
ON public.forms 
FOR INSERT 
WITH CHECK (auth.uid() = owner_user_id OR owner_user_id IS NULL);

CREATE POLICY "Users can update their own forms" 
ON public.forms 
FOR UPDATE 
USING (auth.uid() = owner_user_id OR owner_user_id IS NULL) 
WITH CHECK (auth.uid() = owner_user_id OR owner_user_id IS NULL);

CREATE POLICY "Users can delete their own forms" 
ON public.forms 
FOR DELETE 
USING (auth.uid() = owner_user_id OR owner_user_id IS NULL);