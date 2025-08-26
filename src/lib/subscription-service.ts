import { supabase } from "@/integrations/supabase/client";
import UnifiedStoreManager from "@/utils/unified-store-manager";

export interface Subscription {
  id: string;
  shop_domain: string;
  plan_type: 'free' | 'basic' | 'premium';
  status: string;
  created_at: string;
  updated_at: string;
  trial_days_remaining?: number;
  next_billing_date?: string;
  user_id?: string;
}

export class SubscriptionService {
  private static instance: SubscriptionService;
  private cache = new Map<string, { data: Subscription | null; timestamp: number }>();
  private readonly CACHE_DURATION = 10000; // 10 seconds

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * جلب الاشتراك لمتجر محدد
   */
  async getSubscription(shopDomain: string): Promise<Subscription | null> {
    console.log(`🔥 [SubscriptionService] STARTING getSubscription for: ${shopDomain}`);
    
    // فحص الكاش أولاً
    const cached = this.cache.get(shopDomain);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`💾 [SubscriptionService] Returning cached data for: ${shopDomain}`, cached.data);
      return cached.data;
    }

    try {
      // جلب من قاعدة البيانات
      const { data, error } = await supabase
        .from('shop_subscriptions')
        .select('*')
        .eq('shop_domain', shopDomain)
        .maybeSingle();

      if (error) {
        console.error(`❌ [SubscriptionService] Database error for ${shopDomain}:`, error);
        this.cache.set(shopDomain, { data: null, timestamp: Date.now() });
        return null;
      }

      console.log(`✅ [SubscriptionService] Raw data from DB for ${shopDomain}:`, data);

      let subscription: Subscription | null;

      if (!data) {
        console.log(`ℹ️ [SubscriptionService] No subscription row found for ${shopDomain}. Falling back to FREE plan by default.`);
        subscription = {
          id: `local-default-${shopDomain}`,
          shop_domain: shopDomain,
          plan_type: 'free',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else {
        // معالجة البيانات
        subscription = this.normalizeSubscription(data);
      }

      // حفظ في الكاش
      this.cache.set(shopDomain, { data: subscription, timestamp: Date.now() });

      console.log(`📝 [SubscriptionService] Final processed subscription for ${shopDomain}:`, subscription);
      return subscription;
    } catch (error) {
      console.error(`❌ [SubscriptionService] Exception for ${shopDomain}:`, error);
      return null;
    }
  }

  /**
   * جلب الاشتراك للمتجر النشط الحالي
   */
  async getCurrentSubscription(): Promise<Subscription | null> {
    console.log(`🎯 [SubscriptionService] Getting current subscription...`);
    
    // الحصول على المتجر النشط
    const activeStore = this.getActiveStore();
    if (!activeStore) {
      console.log(`❌ [SubscriptionService] No active store found`);
      return null;
    }

    console.log(`🏪 [SubscriptionService] Active store: ${activeStore}`);
    return await this.getSubscription(activeStore);
  }

  /**
   * الحصول على المتجر النشط بطريقة موثوقة
   */
  private getActiveStore(): string | null {
    // محاولة الحصول من النظام الموحد أولاً
    const unifiedStore = UnifiedStoreManager.getActiveStore();
    if (unifiedStore) {
      console.log(`✅ [SubscriptionService] Found store from UnifiedStoreManager: ${unifiedStore}`);
      return unifiedStore;
    }

    // قائمة المفاتيح المحتملة
    const possibleKeys = [
      'active_shopify_store',
      'current_shopify_store', 
      'shopify_store',
      'active_store',
      'active_shop'
    ];

    // جرب كل مفتاح
    for (const key of possibleKeys) {
      const store = localStorage.getItem(key);
      if (store && store.trim() && store.includes('.myshopify.com')) {
        console.log(`✅ [SubscriptionService] Found store from localStorage[${key}]: ${store}`);
        return store.trim();
      }
    }

    // استخدام متجر افتراضي إذا لم نجد أي شيء
    const defaultStore = 'kooblk.myshopify.com';
    console.log(`⚠️ [SubscriptionService] No active store found, using default: ${defaultStore}`);
    return defaultStore;
  }

  /**
   * تطبيع بيانات الاشتراك
   */
  private normalizeSubscription(data: any): Subscription {
    return {
      id: data.id,
      shop_domain: data.shop_domain,
      plan_type: data.plan_type?.toLowerCase() || 'free',
      status: data.status || 'inactive',
      created_at: data.created_at,
      updated_at: data.updated_at,
      trial_days_remaining: data.trial_days_remaining,
      next_billing_date: data.next_billing_date,
      user_id: data.user_id
    };
  }

  /**
   * مسح الكاش
   */
  clearCache(): void {
    console.log(`🗑️ [SubscriptionService] Clearing cache`);
    this.cache.clear();
  }

  /**
   * مسح الكاش لمتجر محدد
   */
  clearCacheForStore(shopDomain: string): void {
    console.log(`🗑️ [SubscriptionService] Clearing cache for: ${shopDomain}`);
    this.cache.delete(shopDomain);
  }

  /**
   * جلب جميع الاشتراكات للمستخدم الحالي
   */
  async getAllSubscriptions(): Promise<Subscription[]> {
    console.log(`📋 [SubscriptionService] Getting all user subscriptions...`);
    
    try {
      const { data, error } = await supabase
        .from('shop_subscriptions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error(`❌ [SubscriptionService] Error getting all subscriptions:`, error);
        return [];
      }

      const subscriptions = data ? data.map(item => this.normalizeSubscription(item)) : [];
      console.log(`✅ [SubscriptionService] Found ${subscriptions.length} subscriptions:`, subscriptions);
      
      return subscriptions;
    } catch (error) {
      console.error(`❌ [SubscriptionService] Exception getting all subscriptions:`, error);
      return [];
    }
  }

  /**
   * تحديث حالة الاشتراك محلياً (للاستجابة السريعة)
   */
  updateSubscriptionLocally(shopDomain: string, updates: Partial<Subscription>): void {
    const cached = this.cache.get(shopDomain);
    if (cached && cached.data) {
      const updated = { ...cached.data, ...updates };
      this.cache.set(shopDomain, { data: updated, timestamp: Date.now() });
      console.log(`🔄 [SubscriptionService] Updated local subscription for ${shopDomain}:`, updated);
    }
  }

  /**
   * فرض إعادة جلب البيانات
   */
  async forceRefresh(shopDomain?: string): Promise<Subscription | null> {
    const targetStore = shopDomain || this.getActiveStore();
    if (!targetStore) return null;

    console.log(`🔄 [SubscriptionService] Force refreshing for: ${targetStore}`);
    this.clearCacheForStore(targetStore);
    return await this.getSubscription(targetStore);
  }
}

// تصدير instance مفرد
export const subscriptionService = SubscriptionService.getInstance();