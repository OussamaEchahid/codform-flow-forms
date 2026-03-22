import { CURRENCIES } from '@/lib/constants/countries-currencies';
import { supabase } from '@/integrations/supabase/client';
import {
  UNIFIED_EXCHANGE_RATES,
  convertCurrency as unifiedConvertCurrency,
  getExchangeRate as unifiedGetExchangeRate,
  formatCurrency as unifiedFormatCurrency,
  getCurrencyInfo
} from '@/lib/constants/unified-exchange-rates';

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
    console.log('💫 CurrencyService.setShopContext called:', { shopId, userId, previous: { shop: this.currentShopId, user: this.currentUserId } });
    
    const previousShopId = this.currentShopId;
    this.currentShopId = shopId;
    this.currentUserId = userId || '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
    
    // إذا تغير المتجر، نحتاج لإعادة تحميل البيانات
    if (previousShopId !== shopId) {
      console.log(`🔄 Shop context changed: ${previousShopId} → ${shopId}, clearing cache`);
      this.customRates.clear();
      this.displaySettings = {
        showSymbol: true,
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
    if (this.initialized && this.customRates.size > 0) {
      console.log('📋 CurrencyService already initialized with data');
      return;
    }

    try {
      console.log('🚀 Initializing CurrencyService for shop:', this.currentShopId);

      // تحميل جميع البيانات من قاعدة البيانات
      await this.loadAllSettingsFromDatabase();



      this.initialized = true;
      console.log('✅ CurrencyService initialized successfully with settings:', {
        customRatesCount: this.customRates.size,
        displaySettings: this.displaySettings,
        gbpRate: this.customRates.get('GBP')?.rate
      });

      // تطبيق البيانات فوراً
      this.notifyStoreOfCurrencyChanges();

    } catch (error) {
      console.error('❌ Error initializing CurrencyService:', error);
      // Fallback to localStorage if database fails
      await this.loadCustomRates();
      await this.loadDisplaySettings();



      this.initialized = true;
    }
  }

  /**
   * تحميل جميع الإعدادات من قاعدة البيانات باستخدام edge function واحد
   */
  private async loadAllSettingsFromDatabase(): Promise<void> {
    try {
      if (!this.currentShopId) {
        console.log('⚠️ No shop_id set, loading from localStorage only');
        await this.loadCustomRates();
        await this.loadDisplaySettings();
        return;
      }

      console.log('📥 Loading ALL currency settings using edge function for shop:', this.currentShopId);
      
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: settingsData, error: settingsErr } = await supabase.functions.invoke('get-shop-currency-settings', {
        body: { shop_id: this.currentShopId }
      });
      const response = { ok: !settingsErr, json: async () => settingsData } as any;

      if (!response.ok) {
        console.error('❌ Edge function error:', response.statusText);
        await this.loadCustomRates(); // Fallback to localStorage
        await this.loadDisplaySettings();
        return;
      }

      const result = await response.json();
      console.log('📦 Loaded ALL currency settings from edge function:', result);

      // تحميل المعدلات المخصصة
      this.customRates.clear();
      if (result.custom_rates) {
        Object.entries(result.custom_rates).forEach(([currencyCode, rate]: [string, any]) => {
          this.customRates.set(currencyCode, {
            code: currencyCode,
            rate: typeof rate === 'number' ? rate : parseFloat(rate),
            updatedAt: new Date()
          });
        });
        console.log(`✅ Loaded ${this.customRates.size} custom rates from database`);
      }

      // تحميل إعدادات العرض
      if (result.display_settings) {
        const dbSettings = result.display_settings;
        this.displaySettings = {
          showSymbol: dbSettings.show_symbol !== undefined ? dbSettings.show_symbol : true,
          symbolPosition: dbSettings.symbol_position || 'before',
          decimalPlaces: dbSettings.decimal_places !== undefined ? dbSettings.decimal_places : 2,
          customSymbols: result.custom_symbols || {}
        };
        console.log('✅ Loaded display settings from database:', this.displaySettings);
      }

    } catch (error) {
      console.error('❌ Error in loadAllSettingsFromDatabase:', error);
      // Fallback to localStorage
      await this.loadCustomRates();
      await this.loadDisplaySettings();
    }
  }

  /**
   * الحصول على معدل التحويل لعملة معينة - استخدام النظام الموحد
   */
  getExchangeRate(currencyCode: string): number {
    // أولاً: البحث في المعدلات المخصصة
    const customRate = this.customRates.get(currencyCode);
    if (customRate) {
      console.log(`💰 Using custom rate for ${currencyCode}: ${customRate.rate}`);
      return customRate.rate;
    }

    // ثانياً: استخدام النظام الموحد للمعدلات الافتراضية
    const unifiedRate = unifiedGetExchangeRate(currencyCode);
    console.log(`💰 Using unified rate for ${currencyCode}: ${unifiedRate}`);
    return unifiedRate;
  }

  /**
   * تحويل مبلغ من عملة إلى أخرى - استخدام النظام الموحد
   */
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    // استخدام النظام الموحد مع المعدلات المخصصة
    const customRatesObject = Object.fromEntries(
      Array.from(this.customRates.entries()).map(([code, data]) => [code, data.rate])
    );

    const result = unifiedConvertCurrency(amount, fromCurrency, toCurrency, customRatesObject);
    console.log(`🔄 Currency conversion: ${amount} ${fromCurrency} → ${result.toFixed(2)} ${toCurrency}`);
    return result;
  }

  /**
   * تنسيق مبلغ مع رمز/كود العملة مع دعم كامل للـ RTL وموضع الرمز
   */
  formatCurrency(amount: number, currencyCode: string, language: 'en' | 'ar' = 'en'): string {
    const { showSymbol, symbolPosition, decimalPlaces, customSymbols } = this.displaySettings;
    console.log('🔧 CurrencyService.formatCurrency called:', { amount, currencyCode, language, displaySettings: this.displaySettings });

    const info = getCurrencyInfo(currencyCode);
    const formattedAmount = Number.isFinite(amount) ? amount.toFixed(decimalPlaces) : (0).toFixed(decimalPlaces);

    // اختر نص العرض (رمز أو كود مخصص)
    const codeOrCustom = customSymbols[currencyCode] || currencyCode;
    const symbol = customSymbols[currencyCode] || info?.symbol || currencyCode;

    // بيئة RTL أو وجود محارف RTL داخل الرمز/الكود (عربي/عبري...)
    const doc: any = typeof document !== 'undefined' ? document : null;
    const isRTLContext = language === 'ar' || doc?.documentElement?.dir === 'rtl' || doc?.body?.dir === 'rtl';
    const hasRTLChars = /[\u0590-\u08FF]/.test(showSymbol ? symbol : codeOrCustom);

    const LRM = '\u200E'; // Left-to-Right Mark
    const LRI = '\u2066'; // Left-to-Right Isolate
    const PDI = '\u2069'; // Pop Directional Isolate

    // عرض بالكود (showSymbol = false)
    if (showSymbol === false) {
      // إذا كنا في سياق RTL أو الكود نفسه RTL، نعزل المقطع ونضمن بقاء الرقم LTR
      if (isRTLContext || hasRTLChars) {
        const inner = symbolPosition === 'before'
          ? `${codeOrCustom} ${LRM}${formattedAmount}`
          : `${LRM}${formattedAmount}${LRM} ${codeOrCustom}`;
        return `${LRI}${inner}${PDI}`;
      }
      // LTR عادي
      return symbolPosition === 'before'
        ? `${codeOrCustom} ${formattedAmount}`
        : `${formattedAmount} ${codeOrCustom}`;
    }

    // عرض بالرمز
    if (isRTLContext || hasRTLChars) {
      const inner = symbolPosition === 'before'
        ? `${symbol} ${LRM}${formattedAmount}`
        : `${LRM}${formattedAmount}${LRM} ${symbol}`;
      return `${LRI}${inner}${PDI}`;
    }

    // LTR عادي
    return symbolPosition === 'before'
      ? `${symbol} ${formattedAmount}`
      : `${formattedAmount} ${symbol}`;
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
      console.log('💾 Saving display settings:', settings);
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

      const { data: saveResp, error: saveErr } = await supabase.functions.invoke('save-currency-settings', {
        body: requestData
      });
      const response = { ok: !saveErr, json: async () => saveResp } as any;


      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Edge function error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Currency settings saved via edge function:', result);
      
      // إعادة تحميل البيانات فوراً بعد الحفظ لضمان التحديث
      await this.reloadDataFromDatabase();
      
    } catch (error) {
      console.error('❌ Error saving currency settings via edge function:', error);
      throw error;
    }
  }

  /**
   * إعادة تحميل البيانات من قاعدة البيانات فوراً
   */
  private async reloadDataFromDatabase(): Promise<void> {
    try {
      console.log('🔄 Reloading currency data from database...');
      
      this.initialized = false; // إعادة تعيين حالة التهيئة
      this.customRates.clear(); // مسح الكاش
      
      // إعادة تحميل البيانات مباشرة
      await this.loadAllSettingsFromDatabase();
      
      // تطبيق البيانات الجديدة فوراً في الواجهة
      this.notifyStoreOfCurrencyChanges();
      
      this.initialized = true;
      console.log('✅ Currency data reloaded and applied successfully');
    } catch (error) {
      console.error('❌ Error reloading currency data:', error);
    }
  }

  /**
   * إرسال إشعار للمتجر لتطبيق التغييرات الجديدة
   */
  private notifyStoreOfCurrencyChanges(): void {
    try {
      // إرسال custom event للـ unified system
      const event = new CustomEvent('currencySettingsUpdated', {
        detail: {
          displaySettings: this.displaySettings,
          customRates: Object.fromEntries(this.customRates.entries())
        }
      });
      
      window.dispatchEvent(event);
      console.log('📡 Currency change notification sent to store');
      
      // ✅ إجبار النظام الموحد على إعادة التحميل من قاعدة البيانات
      if (typeof window !== 'undefined' && (window as any).CodformUnifiedSystem) {
        // إعادة تهيئة النظام الموحد لجلب البيانات الجديدة
        (window as any).CodformUnifiedSystem.initialize().then(() => {
          (window as any).CodformUnifiedSystem.updateAllElements();
          console.log('🎯 Unified system reinitialized and updated');
        });
      }
      
      // ✅ حفظ الإعدادات الجديدة في localStorage فوراً
      try {
        const settings = {
          currency: 'MAD', // أو أي عملة أخرى حسب الإعدادات
          exchangeRates: Object.fromEntries(this.customRates.entries()),
          displaySettings: this.displaySettings,
          customSymbols: this.displaySettings.customSymbols
        };
        localStorage.setItem('codform_currency_settings', JSON.stringify(settings));
        console.log('💾 Updated settings saved to localStorage');
      } catch (error) {
        console.error('❌ Error saving to localStorage:', error);
      }
      
      // ✅ تطبيق تحديث شامل على جميع العناصر
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).CodformUnifiedSystem) {
          (window as any).CodformUnifiedSystem.refreshAll();
          console.log('🔄 All elements refreshed with new settings');
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Error notifying store of currency changes:', error);
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
          const response = await fetch('https://nnwnuurkcmuvprirsfho.supabase.co/functions/v1/save-currency-settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`
            },
            body: JSON.stringify({
              shop_id: this.currentShopId,
              display_settings: {
                show_symbol: true, // إظهار الكود كافتراضي (تم تصحيح المشكلة)
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