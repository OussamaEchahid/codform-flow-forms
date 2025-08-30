import React, { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SettingsLayout from '@/components/layout/SettingsLayout';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS, type PlanId } from '@/lib/billing/plans';
import UnifiedStoreManager from '@/utils/unified-store-manager';
import { Crown, Zap, Check, Gift, Sparkles } from 'lucide-react';

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
    free: Gift,
    basic: Zap,
    premium: Crown,
  };

  const planSubtitle: Record<PlanId, string> = {
    free: language === 'ar' ? 'مثالي للبداية' : 'Perfect for getting started',
    basic: language === 'ar' ? 'رائع للشركات الصغيرة' : 'Great for small businesses',
    premium: language === 'ar' ? 'الأفضل للفرق النامية' : 'Best for growing teams',
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

        const id = window.setInterval(async () => {
          attempts++;
          await forceRefresh();
          if (isCurrentPlan(planId)) {
            window.clearInterval(id);
            if (upgradePollRef.current) upgradePollRef.current = null;
            setUpgradingTo(null);
            return;
          }

          // المصالحة معطلة - يجب أن تحدث فقط عبر webhook
          // try {
          //   const { subscriptionService } = await import('@/lib/subscription-service');
          //   const sub = activeStore ? await subscriptionService.getSubscription(activeStore) : null;
          //   if (
          //     sub &&
          //     sub.requested_plan_type?.toLowerCase?.() === planId.toLowerCase() &&
          //     sub.plan_type?.toLowerCase?.() !== planId.toLowerCase() &&
          //     !reconcileTriggered
          //   ) {
          //     const { edgeGet } = await import('@/lib/supabase-edge');
          //     console.log('🧩 [BillingCenter] Triggering reconcile-subscriptions from polling...');
          //     await edgeGet('reconcile-subscriptions', { shop: activeStore });
          //     reconcileTriggered = true;
          //   }
          // } catch (e) {
          //   console.warn('Reconcile check failed during polling (BillingCenter):', e);
          // }

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
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 mb-4">
            <Sparkles className="h-4 w-4" />
            {language === 'ar' ? 'خطط مرنة لجميع الأحجام' : 'Flexible plans for every size'}
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            {language === 'ar' ? 'اختر الخطة المثالية' : 'Choose Your Perfect Plan'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'ابدأ مجاناً واستمتع بجميع الميزات الأساسية، ثم قم بالترقية عندما تحتاج إلى المزيد'
              : 'Start free with all essential features, then upgrade when you need more power'}
          </p>
        </div>

        {/* Current Subscription Banner */}
        {subscription && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Crown className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-emerald-900">
                    {language === 'ar' ? 'اشتراكك الحالي' : 'Your Current Subscription'}
                  </div>
                  <div className="text-sm text-emerald-700">
                    <span className="font-medium uppercase">{subscription.plan_type}</span>
                    <span className="mx-2">•</span>
                    <span>{subscription.status === 'pending' ? (language === 'ar' ? 'قيد التفعيل' : 'Pending') : (language === 'ar' ? 'نشط' : 'Active')}</span>
                    {subscription.requested_plan_type && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-amber-600">
                          {language === 'ar' ? 'طلب الترقية إلى ' : 'Upgrading to '}{subscription.requested_plan_type}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">
                    {nextBillingText()}
                  </div>
                </div>
              </div>
              <Badge className={subscription.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}>
                {subscription.status === 'pending'
                  ? language === 'ar' ? 'قيد التفعيل' : 'Activating'
                  : language === 'ar' ? 'نشط' : 'Active'}
              </Badge>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {PLANS.map((p) => {
            const isCurrent = isCurrentPlan(p.id);
            const disabled = isCurrent || (!!subscription && p.id === 'free' && subscription.plan_type !== 'free');
            const Icon = iconForPlan[p.id];
            const isPendingTarget = subscription?.status === 'pending' && subscription?.requested_plan_type === p.id;
            const isUpgrading = upgradingTo === p.id;

            return (
              <Card
                key={p.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  p.popular
                    ? 'border-2 border-purple-300 shadow-lg transform hover:scale-105'
                    : 'border border-gray-200 hover:border-gray-300'
                } ${isCurrent ? 'ring-2 ring-emerald-400' : ''}`}
              >
                {/* Background - إزالة الطبقة الشفافة المشوشة */}

                {/* إزالة شارة Most Popular */}

                {/* Current/Pending Plan Badge */}
                {(isCurrent || isPendingTarget) && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className={isPendingTarget ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}>
                      {isPendingTarget
                        ? (language === 'ar' ? 'قيد التفعيل' : 'Activating')
                        : (language === 'ar' ? 'خطتك الحالية' : 'Current Plan')}
                    </Badge>
                  </div>
                )}

                  <CardHeader className="text-center pb-6">
                    <div className="flex justify-center mb-4">
                      <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                        p.popular ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        <Icon size={28} className={p.popular ? 'text-purple-600' : 'text-gray-600'} />
                      </div>
                    </div>

                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {p.name}
                    </CardTitle>

                    <div className="text-sm text-gray-600 mb-4">
                      {planSubtitle[p.id]}
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`text-4xl font-bold ${
                          p.popular ? 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent' : 'text-gray-900'
                        }`}>
                          {formatPrice(p.monthlyPrice)}
                        </span>
                        {p.id !== 'free' && (
                          <span className="text-gray-600 font-medium">
                            /{language === 'ar' ? 'شهر' : 'month'}
                          </span>
                        )}
                      </div>
                      {p.id === 'free' && (
                        <div className="text-xs text-emerald-600 font-medium mt-1">
                          {language === 'ar' ? 'مجاني إلى الأبد' : 'Free forever'}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Features List - عرض جميع الميزات */}
                    <div className="space-y-3">
                      {p.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                              p.popular ? 'bg-purple-100' : 'bg-emerald-100'
                            }`}>
                              <Check className={`h-3 w-3 ${
                                p.popular ? 'text-purple-600' : 'text-emerald-600'
                              }`} />
                            </div>
                          </div>
                          <span className="text-sm text-gray-700 leading-relaxed">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <div className="pt-6">
                      <Button
                        className={`w-full h-12 font-semibold transition-all duration-300 transform hover:scale-105 ${
                          p.popular
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                            : isCurrent
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default hover:scale-100'
                              : p.id === 'free'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg'
                                : 'border-2 border-gray-300 hover:border-purple-400 bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                        }`}
                        disabled={disabled || isUpgrading}
                        variant="ghost"
                        onClick={() => !isCurrent && startUpgrade(p.id)}
                      >
                        {isCurrent
                          ? (subscription?.status === 'pending'
                              ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full"></div>
                                  {language === 'ar' ? 'قيد التفعيل...' : 'Activating...'}
                                </div>
                              )
                              : (
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4" />
                                  {language === 'ar' ? 'خطتك الحالية' : 'Current Plan'}
                                </div>
                              ))
                          : (isUpgrading
                              ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                  {language === 'ar' ? 'جاري الترقية...' : 'Upgrading...'}
                                </div>
                              )
                              : (p.id === 'free'
                                  ? (
                                    <div className="flex items-center gap-2">
                                      <Gift className="h-4 w-4" />
                                      {language === 'ar' ? 'ابدأ مجاناً' : 'Get Started Free'}
                                    </div>
                                  )
                                  : (
                                    <div className="flex items-center gap-2">
                                      <Zap className="h-4 w-4" />
                                      {language === 'ar' ? 'ترقية إلى ' + p.name : 'Upgrade to ' + p.name}
                                    </div>
                                  )))}
                      </Button>

                      {/* Additional CTA for popular plan */}
                      {p.popular && !isCurrent && (
                        <div className="text-center mt-3">
                          <span className="text-xs text-purple-600 font-medium">
                            {language === 'ar' ? '⭐ الخيار الأكثر شعبية' : '⭐ Most popular choice'}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>{language === 'ar' ? 'إلغاء في أي وقت' : 'Cancel anytime'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>{language === 'ar' ? 'دعم 24/7' : '24/7 support'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>{language === 'ar' ? 'ضمان استرداد المال' : 'Money-back guarantee'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>{language === 'ar' ? 'ترقية فورية' : 'Instant upgrades'}</span>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default BillingCenter;

