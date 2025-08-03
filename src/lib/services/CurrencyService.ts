import { CURRENCIES } from '@/lib/constants/countries-currencies';
import { supabase } from '@/integrations/supabase/client';

export interface CustomCurrencyRate {
  code: string;
  rate: number;
  updatedAt: Date;
}

export interface CurrencyDisplaySettings {
  showSymbol: boolean; // true = رمز (د.م), false = كود (MAD)
  symbolPosition: 'before' | 'after'; // موضع الرمز
  decimalPlaces: number; // عدد المنازل العشرية
}

class CurrencyServiceClass {
  private customRates: Map<string, CustomCurrencyRate> = new Map();
  private displaySettings: CurrencyDisplaySettings = {
    showSymbol: true,
    symbolPosition: 'before',
    decimalPlaces: 2
  };
  private initialized = false;

  /**
   * تهيئة الخدمة وتحميل الإعدادات المخصصة
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // تحميل معدلات التحويل المخصصة
      await this.loadCustomRates();
      
      // تحميل إعدادات العرض
      await this.loadDisplaySettings();
      
      this.initialized = true;
      console.log('✅ CurrencyService initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing CurrencyService:', error);
    }
  }

  /**
   * الحصول على معدل التحويل لعملة معينة
   */
  getExchangeRate(currencyCode: string): number {
    // أولاً: البحث في المعدلات المخصصة
    const customRate = this.customRates.get(currencyCode);
    if (customRate) {
      console.log(`💰 Using custom rate for ${currencyCode}: ${customRate.rate}`);
      return customRate.rate;
    }

    // ثانياً: البحث في المعدلات الافتراضية
    const defaultCurrency = CURRENCIES.find(c => c.code === currencyCode);
    if (defaultCurrency) {
      console.log(`💰 Using default rate for ${currencyCode}: ${defaultCurrency.exchangeRate}`);
      return defaultCurrency.exchangeRate;
    }

    // إذا لم توجد العملة، استخدم 1.0
    console.warn(`⚠️ Currency ${currencyCode} not found, using rate 1.0`);
    return 1.0;
  }

  /**
   * تحويل مبلغ من عملة إلى أخرى
   */
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = this.getExchangeRate(fromCurrency);
    const toRate = this.getExchangeRate(toCurrency);

    // تحويل إلى USD أولاً، ثم إلى العملة المستهدفة
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;

    console.log(`🔄 Currency conversion: ${amount} ${fromCurrency} → ${convertedAmount.toFixed(2)} ${toCurrency}`);
    return convertedAmount;
  }

  /**
   * تنسيق مبلغ مع رمز العملة
   */
  formatCurrency(amount: number, currencyCode: string, language: 'en' | 'ar' = 'en'): string {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    
    if (!currency) {
      return `${amount.toFixed(this.displaySettings.decimalPlaces)} ${currencyCode}`;
    }

    const formattedAmount = amount.toFixed(this.displaySettings.decimalPlaces);
    const displayText = this.displaySettings.showSymbol ? currency.symbol : currency.code;

    if (this.displaySettings.symbolPosition === 'before') {
      return `${displayText}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${displayText}`;
    }
  }

  /**
   * حفظ معدل تحويل مخصص
   */
  async saveCustomRate(currencyCode: string, rate: number): Promise<void> {
    try {
      const customRate: CustomCurrencyRate = {
        code: currencyCode,
        rate,
        updatedAt: new Date()
      };

      // حفظ في قاعدة البيانات
      const { error } = await supabase
        .from('custom_currency_rates')
        .upsert({
          currency_code: currencyCode,
          exchange_rate: rate,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // تحديث الكاش المحلي
      this.customRates.set(currencyCode, customRate);
      
      console.log(`✅ Saved custom rate: ${currencyCode} = ${rate}`);
    } catch (error) {
      console.error('❌ Error saving custom rate:', error);
      throw error;
    }
  }

  /**
   * حذف معدل تحويل مخصص
   */
  async deleteCustomRate(currencyCode: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('custom_currency_rates')
        .delete()
        .eq('currency_code', currencyCode);

      if (error) throw error;

      this.customRates.delete(currencyCode);
      console.log(`✅ Deleted custom rate for ${currencyCode}`);
    } catch (error) {
      console.error('❌ Error deleting custom rate:', error);
      throw error;
    }
  }

  /**
   * حفظ إعدادات العرض
   */
  async saveDisplaySettings(settings: CurrencyDisplaySettings): Promise<void> {
    try {
      const { error } = await supabase
        .from('currency_display_settings')
        .upsert({
          id: 1, // معرف ثابت لإعدادات المستخدم
          show_symbol: settings.showSymbol,
          symbol_position: settings.symbolPosition,
          decimal_places: settings.decimalPlaces,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      this.displaySettings = { ...settings };
      console.log('✅ Saved display settings:', settings);
    } catch (error) {
      console.error('❌ Error saving display settings:', error);
      throw error;
    }
  }

  /**
   * الحصول على إعدادات العرض الحالية
   */
  getDisplaySettings(): CurrencyDisplaySettings {
    return { ...this.displaySettings };
  }

  /**
   * الحصول على قائمة جميع العملات المدعومة
   */
  getSupportedCurrencies() {
    return CURRENCIES.map(currency => ({
      ...currency,
      customRate: this.customRates.get(currency.code)?.rate
    }));
  }

  /**
   * الحصول على جميع المعدلات المخصصة
   */
  getCustomRates(): Map<string, CustomCurrencyRate> {
    return new Map(this.customRates);
  }

  /**
   * تحميل المعدلات المخصصة من قاعدة البيانات
   */
  private async loadCustomRates(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('custom_currency_rates')
        .select('*');

      if (error) throw error;

      if (data) {
        this.customRates.clear();
        data.forEach(rate => {
          this.customRates.set(rate.currency_code, {
            code: rate.currency_code,
            rate: rate.exchange_rate,
            updatedAt: new Date(rate.updated_at)
          });
        });
        console.log(`📥 Loaded ${this.customRates.size} custom rates`);
      }
    } catch (error) {
      console.error('❌ Error loading custom rates:', error);
    }
  }

  /**
   * تحميل إعدادات العرض من قاعدة البيانات
   */
  private async loadDisplaySettings(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('currency_display_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        this.displaySettings = {
          showSymbol: data.show_symbol,
          symbolPosition: data.symbol_position,
          decimalPlaces: data.decimal_places
        };
        console.log('📥 Loaded display settings:', this.displaySettings);
      }
    } catch (error) {
      console.error('❌ Error loading display settings:', error);
    }
  }

  /**
   * إعادة تعيين جميع المعدلات المخصصة إلى القيم الافتراضية
   */
  async resetToDefaults(): Promise<void> {
    try {
      const { error } = await supabase
        .from('custom_currency_rates')
        .delete()
        .neq('currency_code', ''); // حذف جميع السجلات

      if (error) throw error;

      this.customRates.clear();
      console.log('✅ Reset all rates to defaults');
    } catch (error) {
      console.error('❌ Error resetting rates:', error);
      throw error;
    }
  }
}

// إنشاء instance واحد للاستخدام في جميع أنحاء التطبيق
export const CurrencyService = new CurrencyServiceClass();

// دوال مساعدة للاستخدام السريع
export const convertCurrency = (amount: number, from: string, to: string) => 
  CurrencyService.convertCurrency(amount, from, to);

export const formatCurrency = (amount: number, currency: string, language?: 'en' | 'ar') => 
  CurrencyService.formatCurrency(amount, currency, language);

export const getExchangeRate = (currency: string) => 
  CurrencyService.getExchangeRate(currency);