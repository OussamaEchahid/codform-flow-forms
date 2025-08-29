-- Check current RLS policies on shop_subscriptions table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'shop_subscriptions' 
ORDER BY policyname;

-- Check if there are any active stores for astrem.myshopify.com
SELECT shop, user_id, is_active, email 
FROM shopify_stores 
WHERE shop = 'astrem.myshopify.com';

-- Check the subscription data for astrem.myshopify.com
SELECT shop_domain, plan_type, status, user_id, price_amount
FROM shop_subscriptions 
WHERE shop_domain = 'astrem.myshopify.com';