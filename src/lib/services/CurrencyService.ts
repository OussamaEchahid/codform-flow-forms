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
    showSymbol: false,
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
    console.log('💫 CurrencyService.setShopContext called:', { shopId, userId, previous: { shop: this.currentShopId, user: this.currentUserId } });
    
    const previousShopId = this.currentShopId;
    this.currentShopId = shopId;
    this.currentUserId = userId || '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
    
    // إذا تغير المتجر، نحتاج لإعادة تحميل البيانات
    if (previousShopId !== shopId) {
      console.log(`🔄 Shop context changed: ${previousShopId} → ${shopId}, clearing cache`);
      this.customRates.clear();
      this.displaySettings = {
        showSymbol: false,
        symbolPosition: 'before',
        decimalPlaces: 2,
        customSymbols: {}
      };
      this.initialized = false; // إعادة تعيين حالة التهيئة لإجبار إعادة التحميل
      
      // إعادة تحميل البيانات للمتجر الجديد
      if (shopId) {
        this.initialize().catch(error => {
          console.error('❌ Error initializing after shop context change:', error);
        });
      }
    }
    
    console.log(`✅ Currency service context updated - Shop: ${shopId}, User: ${this.currentUserId}`);
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

      // حفظ في localStorage كنسخة احتياطية
      const savedRates = this.getCustomRatesFromStorage();
      savedRates[currencyCode] = customRate;
      localStorage.setItem('codform_custom_currency_rates', JSON.stringify(savedRates));

      // تحديث الكاش المحلي
      this.customRates.set(currencyCode, customRate);
      
      // حفظ مباشرة بـ edge function بدلاً من الحفظ المزدوج
      await this.saveCurrencySettingsToDatabase();
      
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
      this.displaySettings = { ...settings };
      
      // حفظ في localStorage أولاً
      localStorage.setItem('codform_currency_display_settings', JSON.stringify(settings));
      
      // حفظ باستخدام edge function المحسن
      await this.saveCurrencySettingsToDatabase();
      
      console.log('✅ Display settings saved successfully');
    } catch (error) {
      console.error('❌ Error saving display settings:', error);
      throw error;
    }
  }

  /**
   * حفظ جميع إعدادات العملة باستخدام edge function
   */
  async saveCurrencySettingsToDatabase(): Promise<void> {
    if (!this.currentShopId) {
      console.log('⚠️ No shop_id set, skipping database save');
      return;
    }

    try {
      console.log('🔄 Saving currency settings using edge function');
      
      // تحضير البيانات
      const customRates: Record<string, number> = {};
      this.customRates.forEach((value, key) => {
        customRates[key] = value.rate;
      });

      const requestData = {
        shop_id: this.currentShopId,
        display_settings: {
          show_symbol: this.displaySettings.showSymbol,
          symbol_position: this.displaySettings.symbolPosition,
          decimal_places: this.displaySettings.decimalPlaces
        },
        custom_symbols: this.displaySettings.customSymbols,
        custom_rates: customRates
      };

      console.log('📤 Sending data to edge function:', requestData);

      const response = await fetch('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/save-currency-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Edge function error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Currency settings saved via edge function:', result);
      
      // إعادة تحميل البيانات فوراً بعد الحفظ لضمان التحديث
      await this.reloadDataFromDatabase();
      
      // إرسال إشعار للمتجر لإعادة تطبيق التنسيق
      this.notifyStoreOfCurrencyChanges();
      
    } catch (error) {
      console.error('❌ Error saving currency settings via edge function:', error);
      throw error; // أزالة الـ fallback لتجنب الحفظ المزدوج
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

      // حذف من قاعدة البيانات باستخدام edge function
      if (this.currentShopId) {
        try {
          const response = await fetch('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/save-currency-settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`
            },
            body: JSON.stringify({
              shop_id: this.currentShopId,
              display_settings: {
                show_symbol: false,
                symbol_position: 'before',
                decimal_places: 2
              },
              custom_symbols: {},
              custom_rates: {}
            })
          });

          if (!response.ok) {
            console.error('❌ Error resetting via edge function');
          }
        } catch (error) {
          console.error('❌ Error calling reset edge function:', error);
        }
      }

      this.customRates.clear();
      this.displaySettings = {
        showSymbol: false,
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
      const upsertData: any = {
        shop_id: this.currentShopId,
        show_symbol: settings.showSymbol,
        symbol_position: settings.symbolPosition,
        decimal_places: settings.decimalPlaces,
      };

      // إضافة user_id فقط إذا كان متوفراً وليس null
      if (this.currentUserId && this.currentUserId !== 'null') {
        upsertData.user_id = this.currentUserId;
      }

      const { error } = await (supabase as any)
        .from('currency_display_settings')
        .upsert(upsertData);

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
        const upsertData: any = {
          shop_id: this.currentShopId,
          currency_code: currencyCode,
          custom_symbol: symbol,
        };

        // إضافة user_id فقط إذا كان متوفراً وليس null
        if (this.currentUserId && this.currentUserId !== 'null') {
          upsertData.user_id = this.currentUserId;
        }

        const { error } = await (supabase as any)
          .from('custom_currency_symbols')
          .upsert(upsertData);

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
      if (!this.currentShopId || !this.currentUserId) {
        console.error('❌ Cannot save: Shop ID or User ID not set');
        return;
      }

      // نتجاهل الحفظ المباشر هنا لأننا سنحفظ بـ edge function
      console.log(`⚠️ Skipping direct database save for: ${currencyCode} = ${rate} - will save via edge function`);
    } catch (error) {
      console.error('❌ Error in saveCustomRateToDatabase:', error);
    }
  }

  /**
   * تحميل إعدادات العرض من قاعدة البيانات عبر edge function
   */
  private async loadDisplaySettingsFromDatabase(): Promise<void> {
    if (!this.currentShopId) {
      console.log('⚠️ No shop_id set, skipping database load for display settings');
      return;
    }

    try {
      console.log('🔍 Loading display settings from database for shop:', this.currentShopId);
      
      // استخدام edge function لجلب جميع الإعدادات
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/get-shop-currency-settings?shop_id=${this.currentShopId}`, {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.display_settings) {
          this.displaySettings = {
            showSymbol: result.display_settings.show_symbol ?? true,
            symbolPosition: result.display_settings.symbol_position ?? 'before',
            decimalPlaces: result.display_settings.decimal_places ?? 2,
            customSymbols: result.custom_symbols || {}
          };
          
          console.log('✅ Display settings loaded from database:', this.displaySettings);
        } else {
          console.log('ℹ️ No display settings found in database, using defaults');
        }
      } else {
        console.error('❌ Error response from edge function:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error loading display settings from database:', error);
    }
  }

  /**
   * تحميل الرموز المخصصة من قاعدة البيانات
   */
  private async loadCustomSymbolsFromDatabase(): Promise<void> {
    if (!this.currentShopId) {
      console.log('⚠️ No shop_id set, skipping database load for custom symbols');
      return;
    }

    try {
      console.log('🔍 Loading custom symbols from database for shop:', this.currentShopId);
      
      const { data, error } = await (supabase as any)
        .from('custom_currency_symbols')
        .select('currency_code, custom_symbol')
        .eq('shop_id', this.currentShopId);

      if (error) {
        console.error('❌ Database error loading custom symbols:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const customSymbols: Record<string, string> = {};
        data.forEach((row: any) => {
          customSymbols[row.currency_code] = row.custom_symbol;
        });
        
        this.displaySettings.customSymbols = customSymbols;
        console.log('✅ Custom symbols loaded from database:', customSymbols);
      } else {
        console.log('ℹ️ No custom symbols found in database');
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
      if (!this.currentShopId || !this.currentUserId) {
        console.log('⚠️ Shop ID or User ID not set, skipping database load');
        return;
      }

      console.log('🔄 Loading custom rates via edge function for shop:', this.currentShopId);
      await this.loadCustomRatesFromEdgeFunction();
    } catch (error) {
      console.error('❌ Error loading custom rates from database:', error);
    }
  }

  /**
   * تحميل المعدلات المخصصة من edge function
   */
  private async loadCustomRatesFromEdgeFunction(): Promise<void> {
    try {
      if (!this.currentShopId) return;
      
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/get-shop-currency-settings?shop_id=${this.currentShopId}`, {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.custom_rates) {
          this.customRates.clear();
          Object.entries(result.custom_rates).forEach(([code, rate]: [string, any]) => {
            this.customRates.set(code, {
              code,
              rate: parseFloat(rate),
              updatedAt: new Date()
            });
          });
          console.log(`✅ Loaded ${this.customRates.size} custom rates from edge function`);
        }
      }
    } catch (error) {
      console.error('❌ Error loading from edge function:', error);
    }
  }

  /**
   * إعادة تحميل البيانات من قاعدة البيانات بعد الحفظ
   */
  private async reloadDataFromDatabase(): Promise<void> {
    try {
      console.log('🔄 Reloading data from database after save...');
      
      // إعادة تعيين حالة التهيئة لإجبار إعادة التحميل
      this.initialized = false;
      
      // تحميل البيانات من جديد
      await this.loadCustomRatesFromDatabase();
      await this.loadDisplaySettingsFromDatabase();
      
      this.initialized = true;
      console.log('✅ Data reloaded successfully');
    } catch (error) {
      console.error('❌ Error reloading data:', error);
    }
  }

  /**
   * إشعار المتجر بتغيير إعدادات العملة
   */
  private notifyStoreOfCurrencyChanges() {
    try {
      // إرسال رسالة للمتجر (إذا كان في iframe)
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'CODFORM_CURRENCY_UPDATED',
          settings: this.displaySettings,
          timestamp: Date.now()
        }, '*');
      }

      // إرسال event محلي
      window.dispatchEvent(new CustomEvent('codform:currency-updated', {
        detail: {
          settings: this.displaySettings,
          customRates: Array.from(this.customRates.entries())
        }
      }));

      // محاولة استدعاء الدوال المعرضة من المتجر
      if ((window as any).CodformCurrencyManager && typeof (window as any).CodformCurrencyManager.reloadSettings === 'function') {
        (window as any).CodformCurrencyManager.reloadSettings();
      }

      if ((window as any).CodformSmartCurrency && typeof (window as any).CodformSmartCurrency.reapplyFormatting === 'function') {
        (window as any).CodformSmartCurrency.reapplyFormatting();
      }

      console.log('📢 Notified store of currency changes');
    } catch (error) {
      console.error('❌ Error notifying store of currency changes:', error);
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