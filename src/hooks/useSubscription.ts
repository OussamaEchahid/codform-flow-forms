import { useState, useEffect, useCallback } from 'react';
import { subscriptionService, type Subscription } from '@/lib/subscription-service';

export interface UseSubscriptionReturn {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  isCurrentPlan: (planId: string) => boolean;
  getPlanStatus: (planId: string) => 'current' | 'pending' | 'upgrade' | 'downgrade' | 'other';
}

export const useSubscription = (shopDomain?: string): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async (forceRefresh = false) => {
    console.log(`🔥 [useSubscription] STARTING loadSubscription... (force: ${forceRefresh})`);
    
    try {
      setLoading(true);
      setError(null);

      let result: Subscription | null;
      
      if (forceRefresh) {
        result = await subscriptionService.forceRefresh(shopDomain);
      } else if (shopDomain) {
        result = await subscriptionService.getSubscription(shopDomain);
      } else {
        result = await subscriptionService.getCurrentSubscription();
      }

      console.log(`✅ [useSubscription] Subscription loaded:`, result);
      setSubscription(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ [useSubscription] Error loading subscription:`, errorMessage);
      setError(errorMessage);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [shopDomain]);

  const refreshSubscription = useCallback(async () => {
    await loadSubscription(false);
  }, [loadSubscription]);

  const forceRefresh = useCallback(async () => {
    await loadSubscription(true);
  }, [loadSubscription]);

  const isCurrentPlan = useCallback((planId: string): boolean => {
    if (!subscription) return false;
    
    // الخطة الحالية تُعتبر فقط عند تفعيل الاشتراك (active)
    const isActive = subscription.status === 'active';
    const planMatches = subscription.plan_type === planId.toLowerCase();

    const result = isActive && planMatches;
    console.log(`🔍 [useSubscription] isCurrentPlan(${planId}): ${result} (plan: ${subscription.plan_type}, status: ${subscription.status})`);
    
    return result;
  }, [subscription]);

  const getPlanStatus = useCallback((planId: string): 'current' | 'pending' | 'upgrade' | 'downgrade' | 'other' => {
    if (!subscription) {
      console.log(`🔍 [useSubscription] getPlanStatus(${planId}): other (no subscription)`);
      return 'other';
    }

    if (isCurrentPlan(planId)) {
      console.log(`🔍 [useSubscription] getPlanStatus(${planId}): current`);
      return 'current';
    }

    // إذا الاشتراك قيد الانتظار لأي خطة غير الخطة الحالية، نعرض الحالة pending بدل current
    // في حال وجود طلب ترقية معلق لخطة مختلفة عن الخطة الحالية
    if (
      subscription.status === 'pending' &&
      (subscription.requested_plan_type?.toLowerCase?.() === planId.toLowerCase())
    ) {
      console.log(`🔍 [useSubscription] getPlanStatus(${planId}): pending (requested ${subscription.requested_plan_type})`);
      return 'pending';
    }

    const planOrder = ['free', 'basic', 'premium'];
    const currentIndex = planOrder.indexOf(subscription.plan_type);
    const targetIndex = planOrder.indexOf(planId.toLowerCase());

    if (currentIndex === -1 || targetIndex === -1) {
      console.log(`🔍 [useSubscription] getPlanStatus(${planId}): other (invalid plan)`);
      return 'other';
    }

    const status = targetIndex > currentIndex ? 'upgrade' : 'downgrade';
    console.log(`🔍 [useSubscription] getPlanStatus(${planId}): ${status} (current: ${currentIndex}, target: ${targetIndex})`);

    return status;
  }, [subscription, isCurrentPlan]);

  // تحميل البيانات عند mount + محاولة مصالحة تلقائية إذا كانت الحالة pending
  useEffect(() => {
    (async () => {
      await loadSubscription();
      try {
        if (subscription?.status === 'pending') {
          const { edgeGet } = await import('@/lib/supabase-edge');
          const shop = shopDomain || (await subscriptionService.getCurrentSubscription())?.shop_domain;
          if (shop) {
            console.log('🧩 Reconciling pending subscription for', shop);
            await edgeGet('reconcile-subscriptions', { shop });
            // بعد المصالحة، أعد التحميل
            await loadSubscription(true);
          }
        }
      } catch (e) {
        console.warn('Reconcile attempt skipped/failed:', e);
      }
    })();
  }, [loadSubscription]);

  // الاستماع لتغييرات المتجر النشط
  useEffect(() => {
    const handleStoreChange = () => {
      console.log(`🔄 [useSubscription] Store changed, reloading subscription...`);
      loadSubscription();
    };

    window.addEventListener('storeChanged', handleStoreChange);
    window.addEventListener('unifiedStoreChanged', handleStoreChange);
    
    return () => {
      window.removeEventListener('storeChanged', handleStoreChange);
      window.removeEventListener('unifiedStoreChanged', handleStoreChange);
    };
  }, [loadSubscription]);

  return {
    subscription,
    loading,
    error,
    refreshSubscription,
    forceRefresh,
    isCurrentPlan,
    getPlanStatus
  };
};
