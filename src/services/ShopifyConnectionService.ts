
import { shopifySupabase, shopifyStores } from '@/lib/shopify/supabase-client';
import { ShopifyStore } from '@/lib/shopify/database-types';

export class ShopifyConnectionService {
  private static instance: ShopifyConnectionService;
  private tokenCache: Map<string, { token: string; timestamp: number }> = new Map();
  private cacheExpiration = 15 * 60 * 1000; // 15 دقيقة بالميلي ثانية

  private constructor() {
    // منشئ خاص للنمط المفرد (singleton)
  }

  public static getInstance(): ShopifyConnectionService {
    if (!ShopifyConnectionService.instance) {
      ShopifyConnectionService.instance = new ShopifyConnectionService();
    }
    return ShopifyConnectionService.instance;
  }

  /**
   * الحصول على رمز الوصول لمتجر Shopify
   */
  public async getAccessToken(shop: string): Promise<string> {
    if (!shop) {
      throw new Error('معلمة المتجر مطلوبة');
    }
    
    // التحقق من الذاكرة المؤقتة أولاً
    const cachedToken = this.tokenCache.get(shop);
    if (cachedToken && Date.now() - cachedToken.timestamp < this.cacheExpiration) {
      console.log(`استخدام الرمز المخزن مؤقتًا لـ ${shop}`);
      return cachedToken.token;
    }

    try {
      console.log(`جلب رمز الوصول للمتجر: ${shop}`);
      
      // الجلب من قاعدة البيانات باستخدام مساعد shopifyStores
      const { data, error } = await shopifyStores()
        .select('*')
        .eq('shop', shop)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('خطأ في جلب الرمز:', error);
        throw new Error(`فشل في الحصول على رمز الوصول لـ ${shop}: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error(`لم يتم العثور على رمز وصول لـ ${shop}`);
      }

      // الحصول على حقل الرمز
      const storeData = data[0] as ShopifyStore;
      const token = storeData.access_token || '';
      
      if (!token) {
        throw new Error(`رمز وصول غير صالح لـ ${shop}`);
      }

      // تحديث الذاكرة المؤقتة
      this.tokenCache.set(shop, { token, timestamp: Date.now() });
      console.log(`تم استرداد الرمز وتخزينه مؤقتًا لـ ${shop}`);
      
      return token;
    } catch (error) {
      console.error('خطأ في getAccessToken:', error);
      throw error;
    }
  }

  /**
   * اختبار ما إذا كان الرمز صالحًا
   */
  public async isTokenValid(shop: string, token?: string): Promise<boolean> {
    if (!shop) {
      console.error('معلمة المتجر مطلوبة للتحقق من صحة الرمز');
      return false;
    }
    
    try {
      // استخدام الرمز المقدم أو الحصول عليه من الخدمة
      const accessToken = token || await this.getAccessToken(shop);
      
      console.log(`اختبار صلاحية الرمز للمتجر: ${shop}`);
      
      // استدعاء API Shopify لاختبار الرمز
      const { data, error } = await shopifySupabase.functions.invoke('shopify-test-connection', {
        body: { shop, accessToken }
      });

      if (error) {
        console.error('خطأ في التحقق من صحة الرمز:', error);
        return false;
      }

      const isValid = data?.success === true;
      console.log(`نتيجة التحقق من صحة الرمز لـ ${shop}: ${isValid ? 'صالح' : 'غير صالح'}`);
      
      return isValid;
    } catch (error) {
      console.error('خطأ في اختبار صلاحية الرمز:', error);
      return false;
    }
  }

  /**
   * تخزين رمز وصول جديد
   */
  public async storeAccessToken(shop: string, accessToken: string): Promise<boolean> {
    if (!shop || !accessToken) {
      console.error('المتجر ورمز الوصول مطلوبان');
      return false;
    }
    
    try {
      console.log(`تخزين رمز الوصول للمتجر: ${shop}`);
      
      const { error } = await shopifyStores()
        .insert([
          { 
            shop, 
            access_token: accessToken,
            updated_at: new Date().toISOString(),
            is_active: true 
          }
        ]);

      if (error) {
        console.error('خطأ في تخزين الرمز:', error);
        return false;
      }

      // تحديث الذاكرة المؤقتة
      this.tokenCache.set(shop, { token: accessToken, timestamp: Date.now() });
      console.log(`تم تخزين رمز الوصول بنجاح لـ ${shop}`);
      
      return true;
    } catch (error) {
      console.error('خطأ في storeAccessToken:', error);
      return false;
    }
  }

  /**
   * تنشيط متجر بشكل إجباري (تعيينه كمتجر نشط)
   */
  public async forceActivateStore(shop: string): Promise<boolean> {
    if (!shop) {
      console.error('معلمة المتجر مطلوبة');
      return false;
    }
    
    try {
      console.log(`تنشيط المتجر: ${shop}`);
      
      // أولاً، قم بتعيين جميع المتاجر على غير نشطة
      const { error: updateError } = await shopifyStores()
        .update({ is_active: false })
        .neq('id', '0'); // استخدام معرف غير موجود لتحديث جميع السجلات

      if (updateError) {
        console.error('خطأ في تعطيل المتاجر:', updateError);
        // المتابعة على أي حال، سنحاول تنشيط المتجر المستهدف
      }

      // ثم، تعيين المتجر المستهدف كنشط
      const { error } = await shopifyStores()
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('shop', shop);

      if (error) {
        console.error('خطأ في تنشيط المتجر:', error);
        return false;
      }

      console.log(`تم تنشيط المتجر ${shop} بنجاح`);
      return true;
    } catch (error) {
      console.error('خطأ في forceActivateStore:', error);
      return false;
    }
  }

  /**
   * إعادة تعيين الاتصال بالكامل - مسح جميع البيانات والذاكرة المؤقتة
   */
  public completeConnectionReset(): boolean {
    try {
      console.log('إجراء إعادة تعيين كامل للاتصال');
      
      // مسح ذاكرة الرموز المؤقتة
      this.clearTokenCache();
      
      // مسح عناصر localStorage المتعلقة بـ Shopify
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_last_url_shop');
      localStorage.removeItem('shopify_last_error');
      localStorage.removeItem('shopify_recovery_attempt');
      localStorage.removeItem('shopify_failsafe');
      localStorage.removeItem('pending_form_syncs');
      localStorage.removeItem('bypass_auth');
      
      console.log('تم إكمال إعادة تعيين اتصال Shopify');
      return true;
    } catch (error) {
      console.error('خطأ في completeConnectionReset:', error);
      return false;
    }
  }

  /**
   * مسح الرمز المخزن مؤقتًا لمتجر
   */
  public clearTokenCache(shop?: string): void {
    if (shop) {
      console.log(`مسح ذاكرة الرموز المؤقتة للمتجر: ${shop}`);
      this.tokenCache.delete(shop);
    } else {
      console.log('مسح ذاكرة الرموز المؤقتة بالكامل');
      this.tokenCache.clear();
    }
  }
  
  /**
   * حفظ آخر متجر من عنوان URL للاسترداد المحتمل
   */
  public saveLastUrlShop(shop: string): void {
    if (shop) {
      localStorage.setItem('shopify_last_url_shop', shop);
    }
  }
  
  /**
   * الحصول على آخر متجر من عنوان URL
   */
  public getLastUrlShop(): string | null {
    return localStorage.getItem('shopify_last_url_shop');
  }
  
  /**
   * إضافة أو تحديث متجر محليًا ووضعه كمتجر نشط
   */
  public addOrUpdateStore(shop: string, setAsActive = false): void {
    if (!shop) return;
    
    // تحديث localStorage
    if (setAsActive) {
      localStorage.setItem('shopify_store', shop);
      localStorage.setItem('shopify_connected', 'true');
      
      console.log(`تم تعيين ${shop} كمتجر نشط في localStorage`);
    }
  }
  
  /**
   * الحصول على المتجر النشط من التخزين المحلي
   */
  public getActiveStore(): string | null {
    return localStorage.getItem('shopify_store');
  }
  
  /**
   * جلب جميع المتاجر المخزنة محليًا
   */
  public getAllStores(): string[] {
    const activeStore = this.getActiveStore();
    return activeStore ? [activeStore] : [];
  }
  
  /**
   * مسح جميع المتاجر من التخزين المحلي
   */
  public clearAllStores(): void {
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
  }
}

// تصدير نسخة مفردة
export const shopifyConnectionService = ShopifyConnectionService.getInstance();
