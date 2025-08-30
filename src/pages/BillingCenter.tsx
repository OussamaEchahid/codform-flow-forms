import React, { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SettingsLayout from '@/components/layout/SettingsLayout';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS, type PlanId } from '@/lib/billing/plans';
import UnifiedStoreManager from '@/utils/unified-store-manager';
import { Crown, Star, Zap } from 'lucide-react';

const BillingCenter: React.FC = () => {
  const { language } = useI18n();
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

  const iconForPlan: Record<PlanId, React.ComponentType<any>> = {
    free: Star,
    basic: Zap,
    premium: Crown,
  };

  const planSubtitle: Record<PlanId, string> = {
    free: language === 'ar' ? 'مثالي للبدء' : 'Perfect for getting started',
    basic: language === 'ar' ? 'مناسب للمتاجر الصغيرة' : 'Great for small businesses',
    premium: language === 'ar' ? 'الأفضل للفرق المتنامية' : 'Best for growing teams',
  };

  const formatPrice = (price: number) => {
    if (price === 0) return '$0';
    return `$${price}`;
  };

  const nextBillingText = () => {
    const d = subscription?.next_billing_date ? new Date(subscription.next_billing_date) : null;
    if (!d) return language === 'ar' ? 'لا يوجد موعد تجديد' : 'No renewal date';
    return language === 'ar'
      ? `التجديد: ${d.toLocaleDateString('ar')}`
      : `Renews on: ${d.toLocaleDateString()}`;
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
        let reconcileTriggered = false; // نتجنب تكرار المصالحة
        const id = window.setInterval(async () => {
          attempts++;
          await forceRefresh();
          if (isCurrentPlan(planId)) {
            window.clearInterval(id);
            if (upgradePollRef.current) upgradePollRef.current = null;
            setUpgradingTo(null);
            return;
          }

          // إذا لم تتفعّل بعد لكن يوجد طلب ترقية للخطة المطلوبة، شغّل المصالحة مرة واحدة
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
              console.log('🧩 [BillingCenter] Triggering reconcile-subscriptions from polling...');
              await edgeGet('reconcile-subscriptions', { shop: activeStore });
              reconcileTriggered = true;
            }
          } catch (e) {
            console.warn('Reconcile check failed during polling (BillingCenter):', e);
          }

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
      console.error('Upgrade error', e);
      setUpgradingTo(null);
    }
  };

  if (loading) {
    return (
      <SettingsLayout>
        <div className="container mx-auto p-6 text-center">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout>
      <div className="container mx-auto p-6 space-y-6">
        {subscription && (
          <Card className="border-0 shadow-md bg-gradient-to-r from-primary/5 via-purple-100/30 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                {language === 'ar' ? 'اشتراكك' : 'Your Subscription'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-sm leading-6">
                  <div>
                    {language === 'ar' ? 'الخطة الحالية:' : 'Current plan:'}{' '}
                    <b className="uppercase">{subscription.plan_type}</b>
                  </div>
                  <div>
                    {language === 'ar' ? 'الحالة:' : 'Status:'}{' '}
                    <b>{subscription.status === 'pending' ? (language === 'ar' ? 'قيد التفعيل' : 'Pending') : (language === 'ar' ? 'نشط' : 'Active')}</b>
                  </div>
                  <div className="text-muted-foreground">
                    {nextBillingText()}
                  </div>
                  {subscription.requested_plan_type && (
                    <div className="text-amber-600">
                      {language === 'ar' ? 'طلب الترقية إلى:' : 'Requested upgrade to:'}{' '}
                      <b className="uppercase">{subscription.requested_plan_type}</b>
                    </div>
                  )}
                </div>
                <Badge variant="secondary">
                  {subscription.status === 'pending'
                    ? language === 'ar' ? 'قيد التفعيل' : 'Activating'
                    : language === 'ar' ? 'نشط' : 'Active'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((p) => {
            const isCurrent = isCurrentPlan(p.id);
            const disabled = isCurrent || (!!subscription && p.id === 'free' && subscription.plan_type !== 'free');
            const Icon = iconForPlan[p.id];
            const isPendingTarget = subscription?.status === 'pending' && subscription?.requested_plan_type === p.id;
            return (
              <Card key={p.id} className={`relative overflow-hidden transition-all ${p.popular ? 'ring-2 ring-primary' : 'hover:shadow-md'} bg-white`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-sm">
                      {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                    </Badge>
                  </div>
                )}

                {(isCurrent || isPendingTarget) && (
                  <div className="absolute top-3 right-3">
                    <Badge className={isPendingTarget ? 'bg-amber-500 text-white' : ''} variant={isPendingTarget ? 'default' : 'secondary'}>
                      {isPendingTarget
                        ? (language === 'ar' ? 'قيد التفعيل' : 'Activating')
                        : (language === 'ar' ? 'الخطة الحالية' : 'Current Plan')}
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-center">
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <Icon size={22} />
                      <span>{p.name}</span>
                    </div>
                    <div className="text-3xl mt-2 font-semibold">
                      {formatPrice(p.monthlyPrice)}
                      {p.id !== 'free' && <span className="text-sm text-muted-foreground">/ {language === 'ar' ? 'شهرياً' : 'month'}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{planSubtitle[p.id]}</div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 mb-4">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="mt-1">✅</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    disabled={disabled || upgradingTo === p.id}
                    variant={isCurrent ? 'secondary' : 'default'}
                    onClick={() => startUpgrade(p.id)}
                  >
                    {isCurrent
                      ? subscription?.status === 'pending'
                        ? (language === 'ar' ? 'قيد التفعيل...' : 'Activating...')
                        : (language === 'ar' ? 'الخطة الحالية' : 'Current Plan')
                      : upgradingTo === p.id
                        ? (language === 'ar' ? 'جاري الترقية...' : 'Upgrading...')
                        : (language === 'ar' ? 'اختر الخطة' : 'Choose plan')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </SettingsLayout>
  );
};

export default BillingCenter;

