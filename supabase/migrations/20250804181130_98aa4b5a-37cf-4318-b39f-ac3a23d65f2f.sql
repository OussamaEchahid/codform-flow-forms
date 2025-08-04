-- إصلاح قيود قاعدة البيانات لجدول currency_display_settings
ALTER TABLE currency_display_settings ADD CONSTRAINT unique_shop_id UNIQUE (shop_id);

-- إصلاح قيود قاعدة البيانات لجدول custom_currency_symbols  
ALTER TABLE custom_currency_symbols ADD CONSTRAINT unique_shop_currency UNIQUE (shop_id, currency_code);

-- إصلاح قيود قاعدة البيانات لجدول custom_currency_rates
ALTER TABLE custom_currency_rates ADD CONSTRAINT unique_currency_code UNIQUE (currency_code);