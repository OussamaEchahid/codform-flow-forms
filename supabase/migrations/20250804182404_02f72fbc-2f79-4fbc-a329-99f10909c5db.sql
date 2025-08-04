-- حذف جميع ال policies الموجودة أولاً
DROP POLICY IF EXISTS "Users can create their own custom rates" ON custom_currency_rates;
DROP POLICY IF EXISTS "Users can update their own custom rates" ON custom_currency_rates;
DROP POLICY IF EXISTS "Users can view their own custom rates" ON custom_currency_rates;
DROP POLICY IF EXISTS "Users can delete their own custom rates" ON custom_currency_rates;
DROP POLICY IF EXISTS "Users can manage currency display settings" ON currency_display_settings;
DROP POLICY IF EXISTS "Users can view currency display settings" ON currency_display_settings;
DROP POLICY IF EXISTS "Users can insert currency display settings" ON currency_display_settings;
DROP POLICY IF EXISTS "Users can update currency display settings" ON currency_display_settings;
DROP POLICY IF EXISTS "Users can manage their own currency symbols" ON custom_currency_symbols;
DROP POLICY IF EXISTS "Users can view currency symbols" ON custom_currency_symbols;
DROP POLICY IF EXISTS "Users can insert currency symbols" ON custom_currency_symbols;
DROP POLICY IF EXISTS "Users can update currency symbols" ON custom_currency_symbols;
DROP POLICY IF EXISTS "Users can delete currency symbols" ON custom_currency_symbols;

-- إنشاء policies جديدة بصلاحيات عامة
CREATE POLICY "Allow all operations on custom_currency_rates" ON custom_currency_rates 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on currency_display_settings" ON currency_display_settings 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on custom_currency_symbols" ON custom_currency_symbols 
FOR ALL USING (true) WITH CHECK (true);