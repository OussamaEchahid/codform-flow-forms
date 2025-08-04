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
  customSymbols: Record<string, string>; // رموز عرض مخصصة: { "XOF": "CFA", "XAF": "CFA" }
}

class CurrencyServiceClass {
  private customRates: Map<string, CustomCurrencyRate> = new Map();
  private displaySettings: CurrencyDisplaySettings = {
    showSymbol: true,
    symbolPosition: 'before',
    decimalPlaces: 2,
    customSymbols: {}
  };
  private initialized = false;
  private currentShopId: string | null = null;
  private currentUserId: string | null = null;

  /**
   * تعيين معرف المتجر والمستخدم الحالي
   */
  setShopContext(shopId: string | null, userId: string | null = null) {
    this.currentShopId = shopId;
    this.currentUserId = userId;
    console.log(`💫 Currency service context updated - Shop: ${shopId}, User: ${userId}`);
  }

  /**
   * تهيئة الخدمة وتحميل الإعدادات المخصصة
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // تحميل معدلات التحويل المخصصة من قاعدة البيانات
      await this.loadCustomRatesFromDatabase();
      
      // تحميل إعدادات العرض من قاعدة البيانات
      await this.loadDisplaySettingsFromDatabase();
      
      this.initialized = true;
      console.log('✅ CurrencyService initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing CurrencyService:', error);
      // Fallback to localStorage if database fails
      await this.loadCustomRates();
      await this.loadDisplaySettings();
      this.initialized = true;
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
    console.log('🔧 CurrencyService.formatCurrency called:', {
      amount,
      currencyCode,
      language,
      displaySettings: this.displaySettings,
      customSymbols: this.displaySettings.customSymbols
    });
    
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    
    if (!currency) {
      console.log('❌ Currency not found:', currencyCode);
      return `${amount.toFixed(this.displaySettings.decimalPlaces)} ${currencyCode}`;
    }

    const formattedAmount = amount.toFixed(this.displaySettings.decimalPlaces);
    
    // استخدام الرمز المخصص إذا كان متوفراً
    let displayText: string;
    if (this.displaySettings.customSymbols[currencyCode]) {
      displayText = this.displaySettings.customSymbols[currencyCode];
      console.log('✅ Using custom symbol:', displayText, 'for currency:', currencyCode);
    } else {
      displayText = this.displaySettings.showSymbol ? currency.symbol : currency.code;
      console.log('💡 Using default symbol:', displayText, 'for currency:', currencyCode);
    }

    const result = this.displaySettings.symbolPosition === 'before' 
      ? `${displayText}${formattedAmount}`
      : `${formattedAmount} ${displayText}`;
      
    console.log('✅ Final formatted currency:', result);
    return result;
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

      // حفظ في قاعدة البيانات أولاً
      await this.saveCustomRateToDatabase(currencyCode, rate);

      // حفظ في localStorage كنسخة احتياطية
      const savedRates = this.getCustomRatesFromStorage();
      savedRates[currencyCode] = customRate;
      localStorage.setItem('codform_custom_currency_rates', JSON.stringify(savedRates));

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
      // حذف من localStorage
      const savedRates = this.getCustomRatesFromStorage();
      delete savedRates[currencyCode];
      localStorage.setItem('codform_custom_currency_rates', JSON.stringify(savedRates));

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
      // حفظ في قاعدة البيانات أولاً
      await this.saveDisplaySettingsToDatabase(settings);
      
      // حفظ في localStorage كنسخة احتياطية
      localStorage.setItem('codform_currency_display_settings', JSON.stringify(settings));

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
   * الحصول على المعدلات المخصصة من localStorage
   */
  private getCustomRatesFromStorage(): Record<string, CustomCurrencyRate> {
    try {
      const saved = localStorage.getItem('codform_custom_currency_rates');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('❌ Error loading custom rates from storage:', error);
      return {};
    }
  }

  /**
   * تحميل المعدلات المخصصة من localStorage
   */
  private async loadCustomRates(): Promise<void> {
    try {
      const savedRates = this.getCustomRatesFromStorage();
      this.customRates.clear();
      
      Object.values(savedRates).forEach(rate => {
        this.customRates.set(rate.code, {
          ...rate,
          updatedAt: new Date(rate.updatedAt)
        });
      });
      
      console.log(`📥 Loaded ${this.customRates.size} custom rates from localStorage`);
    } catch (error) {
      console.error('❌ Error loading custom rates:', error);
    }
  }

  /**
   * تحميل إعدادات العرض من localStorage
   */
  private async loadDisplaySettings(): Promise<void> {
    try {
      const saved = localStorage.getItem('codform_currency_display_settings');
      if (saved) {
        this.displaySettings = JSON.parse(saved);
        console.log('📥 Loaded display settings from localStorage:', this.displaySettings);
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
      // حذف من localStorage
      localStorage.removeItem('codform_custom_currency_rates');
      localStorage.removeItem('codform_currency_display_settings');

      this.customRates.clear();
      this.displaySettings = {
        showSymbol: true,
        symbolPosition: 'before',
        decimalPlaces: 2,
        customSymbols: {}
      };
      
      console.log('✅ Reset all rates to defaults');
    } catch (error) {
      console.error('❌ Error resetting rates:', error);
      throw error;
    }
  }

  /**
   * حفظ إعدادات العرض في قاعدة البيانات
   */
  private async saveDisplaySettingsToDatabase(settings: CurrencyDisplaySettings): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('currency_display_settings')
        .upsert({
          user_id: this.currentUserId,
          shop_id: this.currentShopId,
          show_symbol: settings.showSymbol,
          symbol_position: settings.symbolPosition,
          decimal_places: settings.decimalPlaces,
        });

      if (error) throw error;

      // حفظ الرموز المخصصة
      if (settings.customSymbols) {
        await this.saveCustomSymbolsToDatabase(settings.customSymbols);
      }

      console.log('✅ Display settings saved to database');
    } catch (error) {
      console.error('❌ Error saving display settings to database:', error);
      throw error;
    }
  }

  /**
   * حفظ الرموز المخصصة في قاعدة البيانات
   */
  private async saveCustomSymbolsToDatabase(customSymbols: Record<string, string>): Promise<void> {
    try {
      for (const [currencyCode, symbol] of Object.entries(customSymbols)) {
        const { error } = await (supabase as any)
          .from('custom_currency_symbols')
          .upsert({
            user_id: this.currentUserId,
            shop_id: this.currentShopId,
            currency_code: currencyCode,
            custom_symbol: symbol,
          });

        if (error) throw error;
      }
      
      console.log('✅ Custom symbols saved to database');
    } catch (error) {
      console.error('❌ Error saving custom symbols to database:', error);
      throw error;
    }
  }

  /**
   * حفظ معدل مخصص في قاعدة البيانات
   */
  private async saveCustomRateToDatabase(currencyCode: string, rate: number): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('custom_currency_rates')
        .upsert({
          user_id: this.currentUserId,
          currency_code: currencyCode,
          exchange_rate: rate,
        });

      if (error) throw error;
      
      console.log(`✅ Custom rate saved to database: ${currencyCode} = ${rate}`);
    } catch (error) {
      console.error('❌ Error saving custom rate to database:', error);
      throw error;
    }
  }

  /**
   * تحميل إعدادات العرض من قاعدة البيانات
   */
  private async loadDisplaySettingsFromDatabase(): Promise<void> {
    try {
      const { data, error } = await (supabase as any)
        .from('currency_display_settings')
        .select('*')
        .eq('shop_id', this.currentShopId)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        this.displaySettings = {
          showSymbol: data.show_symbol,
          symbolPosition: data.symbol_position,
          decimalPlaces: data.decimal_places,
          customSymbols: {}
        };

        // تحميل الرموز المخصصة
        await this.loadCustomSymbolsFromDatabase();
        
        console.log('✅ Display settings loaded from database:', this.displaySettings);
      }
    } catch (error) {
      console.error('❌ Error loading display settings from database:', error);
    }
  }

  /**
   * تحميل الرموز المخصصة من قاعدة البيانات
   */
  private async loadCustomSymbolsFromDatabase(): Promise<void> {
    try {
      const { data, error } = await (supabase as any)
        .from('custom_currency_symbols')
        .select('currency_code, custom_symbol')
        .eq('shop_id', this.currentShopId);

      if (error) throw error;

      if (data) {
        const customSymbols: Record<string, string> = {};
        data.forEach((row: any) => {
          customSymbols[row.currency_code] = row.custom_symbol;
        });
        
        this.displaySettings.customSymbols = customSymbols;
        console.log('✅ Custom symbols loaded from database:', customSymbols);
      }
    } catch (error) {
      console.error('❌ Error loading custom symbols from database:', error);
    }
  }

  /**
   * تحميل المعدلات المخصصة من قاعدة البيانات
   */
  private async loadCustomRatesFromDatabase(): Promise<void> {
    try {
      const { data, error } = await (supabase as any)
        .from('custom_currency_rates')
        .select('*')
        .eq('user_id', this.currentUserId);

      if (error) throw error;

      if (data) {
        this.customRates.clear();
        data.forEach((row: any) => {
          this.customRates.set(row.currency_code, {
            code: row.currency_code,
            rate: parseFloat(row.exchange_rate),
            updatedAt: new Date(row.updated_at)
          });
        });
        
        console.log(`✅ Loaded ${this.customRates.size} custom rates from database`);
      }
    } catch (error) {
      console.error('❌ Error loading custom rates from database:', error);
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