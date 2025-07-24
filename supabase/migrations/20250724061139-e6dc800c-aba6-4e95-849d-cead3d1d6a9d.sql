-- إصلاح لون السعر في جميع عروض الكمية الموجودة
UPDATE quantity_offers 
SET styling = jsonb_set(styling, '{priceColor}', '"#000000"')
WHERE styling->>'priceColor' = '#ef4444' OR styling->>'priceColor' IS NULL;