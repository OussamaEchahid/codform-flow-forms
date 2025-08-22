import { useState, useEffect, useCallback } from 'react';
import { subscriptionService, type Subscription } from '@/lib/subscription-service';

export interface UseSubscriptionReturn {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  isCurrentPlan: (planId: string) => boolean;
  getPlanStatus: (planId: string) => 'current' | 'upgrade' | 'downgrade' | 'other';
}

export const useSubscription = (shopDomain?: string): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async (forceRefresh = false) => {
    console.log(`🔄 [useSubscription] Loading subscription... (force: ${forceRefresh})`);
    
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
    
    // قبول الاشتراكات النشطة والمعلقة كخطط حالية
    const acceptableStatuses = ['active', 'pending'];
    const hasAcceptableStatus = acceptableStatuses.includes(subscription.status);
    const planMatches = subscription.plan_type === planId.toLowerCase();
    
    const result = hasAcceptableStatus && planMatches;
    console.log(`🔍 [useSubscription] isCurrentPlan(${planId}): ${result} (plan: ${subscription.plan_type}, status: ${subscription.status})`);
    
    return result;
  }, [subscription]);

  const getPlanStatus = useCallback((planId: string): 'current' | 'upgrade' | 'downgrade' | 'other' => {
    if (!subscription) {
      console.log(`🔍 [useSubscription] getPlanStatus(${planId}): other (no subscription)`);
      return 'other';
    }

    if (isCurrentPlan(planId)) {
      console.log(`🔍 [useSubscription] getPlanStatus(${planId}): current`);
      return 'current';
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

  // تحميل البيانات عند mount
  useEffect(() => {
    loadSubscription();
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