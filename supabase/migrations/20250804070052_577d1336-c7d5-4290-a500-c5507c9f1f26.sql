-- إنشاء جدول إعدادات العملة
CREATE TABLE IF NOT EXISTS public.currency_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL,
  shop_domain TEXT NOT NULL,
  display_settings JSONB NOT NULL DEFAULT '{
    "show_symbol": true,
    "symbol_position": "before",
    "decimal_places": 0
  }'::jsonb,
  custom_symbols JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_domain)
);

-- تمكين Row Level Security
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات
CREATE POLICY "Allow read access to currency settings" ON public.currency_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON public.currency_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON public.currency_settings
  FOR UPDATE USING (true);

-- إضافة trigger للتحديث التلقائي للوقت
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_currency_settings_updated_at 
  BEFORE UPDATE ON public.currency_settings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- إدراج إعدادات افتراضية للمتجر
INSERT INTO public.currency_settings (shop_domain, shop_id, display_settings, custom_symbols)
VALUES (
  'astrem.myshopify.com',
  'astrem.myshopify.com',
  '{
    "show_symbol": true,
    "symbol_position": "before", 
    "decimal_places": 0
  }'::jsonb,
  '{
    "USD": "$",
    "SAR": "ر.س",
    "MAD": "د.م",
    "AED": "د.إ",
    "EGP": "ج.م"
  }'::jsonb
)
ON CONFLICT (shop_domain) DO UPDATE SET
  display_settings = EXCLUDED.display_settings,
  custom_symbols = EXCLUDED.custom_symbols,
  updated_at = NOW();