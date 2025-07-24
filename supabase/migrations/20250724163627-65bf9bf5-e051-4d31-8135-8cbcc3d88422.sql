-- Add access token for codmagnet.com store
UPDATE shopify_stores 
SET access_token = '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',
    scope = 'read_products,read_product_listings,read_themes,read_script_tags',
    updated_at = now()
WHERE shop = 'codmagnet.com';