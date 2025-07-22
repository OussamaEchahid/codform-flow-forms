-- حذف جميع السجلات المكررة من shopify_product_settings
-- الاحتفاظ بأحدث سجل لكل مجموعة (shop_id, product_id)
DELETE FROM shopify_product_settings 
WHERE id NOT IN (
  SELECT DISTINCT ON (shop_id, product_id) id 
  FROM shopify_product_settings 
  ORDER BY shop_id, product_id, updated_at DESC
);

-- إعادة إنشاء القيد الفريد إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_shop_product' 
    AND conrelid = 'shopify_product_settings'::regclass
  ) THEN
    ALTER TABLE shopify_product_settings 
    ADD CONSTRAINT unique_shop_product 
    UNIQUE (shop_id, product_id);
  END IF;
END $$;

-- تحديث quantity_offers لتستخدم المعرفات الصحيحة
UPDATE quantity_offers 
SET form_id = (
  SELECT sps.form_id 
  FROM shopify_product_settings sps 
  WHERE sps.product_id = quantity_offers.product_id 
  AND sps.shop_id = quantity_offers.shop_id 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM shopify_product_settings sps 
  WHERE sps.product_id = quantity_offers.product_id 
  AND sps.shop_id = quantity_offers.shop_id
);