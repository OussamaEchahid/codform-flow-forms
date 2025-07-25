-- ربط جميع المتاجر النشطة بالمستخدم الحالي (36d7eb85-0c45-4b4f-bea1-a9cb732ca893)
-- هذا سيحل مشكلة عدم ظهور المتاجر في قسم "My Stores"
UPDATE shopify_stores 
SET user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893',
    updated_at = now()
WHERE user_id IS NOT NULL 
  AND user_id != '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'
  AND is_active = true
  AND access_token IS NOT NULL
  AND access_token != ''
  AND access_token != 'placeholder_token';