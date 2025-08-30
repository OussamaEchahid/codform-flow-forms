import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS, type PlanId } from '@/lib/billing/plans';
import UnifiedStoreManager from '@/utils/unified-store-manager';
import { PlanCard } from '@/components/pricing/PlanCard';
import { PricingHeader } from '@/components/pricing/PricingHeader';
import { CurrentSubscriptionBanner } from '@/components/pricing/CurrentSubscriptionBanner';
import { PricingFooter } from '@/components/pricing/PricingFooter';



const Plans = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const plans = PLANS.map(p => ({
    name: p.name,
    price: p.monthlyPrice,
    currency: 'USD',
    period: 'month',
    popular: !!p.popular,
    features: p.features,
    id: p.id,
    limits: {
      orders: p.id === 'free' ? 70 : p.id === 'basic' ? 1000 : null,
      abandoned: p.id === 'free' ? 30 : p.id === 'basic' ? 30 : null
    }
  }));


  const { subscription, loading, forceRefresh, isCurrentPlan } = useSubscription();
  const [upgradingTo, setUpgradingTo] = useState<PlanId | null>(null);
  const upgradePollRef = useRef<number | null>(null);

  const activeStore = useMemo(() => {
    return (
      UnifiedStoreManager.getActiveStore() ||
      localStorage.getItem('active_store') ||
      localStorage.getItem('active_shop') ||
      localStorage.getItem('active_shopify_store') ||
      localStorage.getItem('shopify_store') ||
      ''
    );
  }, []);



  const planSubtitle: Record<PlanId, string> = {
    free: language === 'ar' ? 'مجاني للبدء' : 'Free forever',
    basic: language === 'ar' ? 'للأعمال النامية' : 'For growing businesses',
    premium: language === 'ar' ? 'للشركات الجادة' : 'For ambitious teams',
  };

  const startUpgrade = async (planId: PlanId) => {
    try {
      if (!activeStore) return;
      setUpgradingTo(planId);

      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('change-plan', {
        body: { shop: activeStore, planId },
      });
      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');

        const onFocus = async () => {
          await forceRefresh();
          window.removeEventListener('focus', onFocus);
        };
        window.addEventListener('focus', onFocus);

        let attempts = 0;
        const maxAttempts = 30;
        let reconcileTriggered = false;
        const id = window.setInterval(async () => {
          attempts++;
          await forceRefresh();
          if (isCurrentPlan(planId)) {
            window.clearInterval(id);
            if (upgradePollRef.current) upgradePollRef.current = null;
            setUpgradingTo(null);
            return;
          }

          try {
            const { subscriptionService } = await import('@/lib/subscription-service');
            const sub = activeStore ? await subscriptionService.getSubscription(activeStore) : null;
            if (
              sub &&
              sub.requested_plan_type?.toLowerCase?.() === planId.toLowerCase() &&
              sub.plan_type?.toLowerCase?.() !== planId.toLowerCase() &&
              !reconcileTriggered
            ) {
              const { edgeGet } = await import('@/lib/supabase-edge');
              await edgeGet('reconcile-subscriptions', { shop: activeStore });
              reconcileTriggered = true;
            }
          } catch {}

          if (attempts >= maxAttempts) {
            window.clearInterval(id);
            if (upgradePollRef.current) upgradePollRef.current = null;
            setUpgradingTo(null);
          }
        }, 3000);
        upgradePollRef.current = id;
      } else {
        setUpgradingTo(null);
      }
    } catch (e) {
      setUpgradingTo(null);
    }
  };

  

  return (
    <div className="flex min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />

      <div className="flex-1">
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <PricingHeader language={language} />
            
            <CurrentSubscriptionBanner 
              subscription={subscription} 
              language={language} 
            />

            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  planSubtitle={planSubtitle[plan.id as PlanId]}
                  isCurrentPlan={isCurrentPlan(plan.id as PlanId)}
                  isUpgrading={upgradingTo === (plan.id as PlanId)}
                  onUpgrade={() => startUpgrade(plan.id as PlanId)}
                  language={language}
                  subscription={subscription}
                />
              ))}
            </div>

            <PricingFooter
              language={language}
              onContactClick={() => navigate('/contact')}
              onDashboardClick={() => navigate('/dashboard')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;