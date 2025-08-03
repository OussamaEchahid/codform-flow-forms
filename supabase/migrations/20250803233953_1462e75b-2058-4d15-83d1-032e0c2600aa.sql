-- إنشاء جدول لمعدلات التحويل المخصصة
CREATE TABLE public.custom_currency_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currency_code TEXT NOT NULL UNIQUE,
  exchange_rate DECIMAL(15,8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- إنشاء جدول لإعدادات عرض العملة
CREATE TABLE public.currency_display_settings (
  id INTEGER NOT NULL DEFAULT 1 PRIMARY KEY,
  show_symbol BOOLEAN NOT NULL DEFAULT true,
  symbol_position TEXT NOT NULL DEFAULT 'before' CHECK (symbol_position IN ('before', 'after')),
  decimal_places INTEGER NOT NULL DEFAULT 2 CHECK (decimal_places >= 0 AND decimal_places <= 4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- تمكين RLS للجداول
ALTER TABLE public.custom_currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_display_settings ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان لجدول معدلات التحويل المخصصة
CREATE POLICY "Users can view their own custom rates" 
ON public.custom_currency_rates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom rates" 
ON public.custom_currency_rates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom rates" 
ON public.custom_currency_rates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom rates" 
ON public.custom_currency_rates 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء سياسات الأمان لجدول إعدادات العرض
CREATE POLICY "Users can view their own display settings" 
ON public.currency_display_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own display settings" 
ON public.currency_display_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own display settings" 
ON public.currency_display_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own display settings" 
ON public.currency_display_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء triggers لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_currency_rates_updated_at
  BEFORE UPDATE ON public.custom_currency_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_currency_display_settings_updated_at
  BEFORE UPDATE ON public.currency_display_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_custom_currency_rates_user_id ON public.custom_currency_rates(user_id);
CREATE INDEX idx_custom_currency_rates_currency_code ON public.custom_currency_rates(currency_code);
CREATE INDEX idx_currency_display_settings_user_id ON public.currency_display_settings(user_id);