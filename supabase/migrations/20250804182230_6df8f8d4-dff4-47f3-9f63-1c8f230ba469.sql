-- إصلاح RLS policies بالصيغة الصحيحة
DROP POLICY IF EXISTS "Users can create their own custom rates" ON custom_currency_rates;
DROP POLICY IF EXISTS "Users can update their own custom rates" ON custom_currency_rates;
DROP POLICY IF EXISTS "Users can view their own custom rates" ON custom_currency_rates;
DROP POLICY IF EXISTS "Users can delete their own custom rates" ON custom_currency_rates;
DROP POLICY IF EXISTS "Users can manage currency display settings" ON currency_display_settings;
DROP POLICY IF EXISTS "Users can manage their own currency symbols" ON custom_currency_symbols;

-- إنشاء policies جديدة بالصيغة الصحيحة
CREATE POLICY "Users can create their own custom rates" ON custom_currency_rates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own custom rates" ON custom_currency_rates 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can view their own custom rates" ON custom_currency_rates 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete their own custom rates" ON custom_currency_rates 
FOR DELETE 
USING (true);

-- إصلاح policy لجدول currency_display_settings
CREATE POLICY "Users can view currency display settings" ON currency_display_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert currency display settings" ON currency_display_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update currency display settings" ON currency_display_settings 
FOR UPDATE 
USING (true);

-- إصلاح policy لجدول custom_currency_symbols
CREATE POLICY "Users can view currency symbols" ON custom_currency_symbols 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert currency symbols" ON custom_currency_symbols 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update currency symbols" ON custom_currency_symbols 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete currency symbols" ON custom_currency_symbols 
FOR DELETE 
USING (true);