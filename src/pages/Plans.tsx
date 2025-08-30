import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppSidebar from '@/components/layout/AppSidebar';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS, type PlanId } from '@/lib/billing/plans';
import UnifiedStoreManager from '@/utils/unified-store-manager';
import { Crown, Zap, Check, Gift, Sparkles } from "lucide-react";



const Plans = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();

  // Professional plan configuration based on the image
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      originalPrice: null,
      subtitle: language === 'ar' ? 'مثالي للبداية' : 'Perfect for getting started',
      popular: false,
      gradient: 'from-gray-50 to-gray-100',
      borderColor: 'border-gray-200',
      buttonVariant: 'outline' as const,
      features: [
        { text: language === 'ar' ? '70 طلب/شهر' : '70 Orders/mo', included: true },
        { text: language === 'ar' ? 'تصميم نموذج مخصص لكل منتج' : 'Custom form design for each product', included: true },
        { text: language === 'ar' ? 'منشئ صفحات الهبوط' : 'Landing page builder', included: true },
        { text: language === 'ar' ? '30 سلة مهجورة' : '30 Abandoned checkouts', included: true },
        { text: language === 'ar' ? 'إدارة العملات' : 'Currency Management', included: true },
        { text: language === 'ar' ? 'جوجل شيتس' : 'Google Sheets', included: true },
        { text: language === 'ar' ? 'بكسلات وسائل التواصل المتعددة' : 'Multi Social media Pixels', included: true },
        { text: language === 'ar' ? 'عروض الكمية + تصميم مخصص' : 'Quantity offers + Customized design', included: true },
        { text: language === 'ar' ? 'البيع الإضافي + تصميم مخصص' : 'Upsell + Customized design', included: true },
        { text: language === 'ar' ? 'أسعار الشحن' : 'Shipping Rates', included: true },
        { text: language === 'ar' ? 'دعم 24x7' : '24x7 Support', included: true }
      ]
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 11.85,
      originalPrice: null,
      subtitle: language === 'ar' ? 'رائع للشركات الصغيرة' : 'Great for small businesses',
      popular: true,
      gradient: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-300',
      buttonVariant: 'default' as const,
      features: [
        { text: language === 'ar' ? '1000 طلب/شهر' : '1000 Orders/mo', included: true },
        { text: language === 'ar' ? 'تصميم نموذج مخصص لكل منتج' : 'Custom form design for each product', included: true },
        { text: language === 'ar' ? 'منشئ صفحات الهبوط' : 'Landing page builder', included: true },
        { text: language === 'ar' ? '30 سلة مهجورة' : '30 Abandoned checkouts', included: true },
        { text: language === 'ar' ? 'إدارة العملات' : 'Currency Management', included: true },
        { text: language === 'ar' ? 'جوجل شيتس' : 'Google Sheets', included: true },
        { text: language === 'ar' ? 'بكسلات وسائل التواصل المتعددة' : 'Multi Social media Pixels', included: true },
        { text: language === 'ar' ? 'عروض الكمية + تصميم مخصص' : 'Quantity offers + Customized design', included: true },
        { text: language === 'ar' ? 'البيع الإضافي + تصميم مخصص' : 'Upsell + Customized design', included: true },
        { text: language === 'ar' ? 'أسعار الشحن' : 'Shipping Rates', included: true },
        { text: language === 'ar' ? 'دعم 24x7' : '24x7 Support', included: true }
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 22.85,
      originalPrice: null,
      subtitle: language === 'ar' ? 'الأفضل للفرق النامية' : 'Best for growing teams',
      popular: false,
      gradient: 'from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-300',
      buttonVariant: 'outline' as const,
      features: [
        { text: language === 'ar' ? 'طلبات غير محدودة/شهر' : 'Unlimited Orders/mo', included: true },
        { text: language === 'ar' ? 'تصميم نموذج مخصص لكل منتج' : 'Custom form design for each product', included: true },
        { text: language === 'ar' ? 'منشئ صفحات الهبوط' : 'Landing page builder', included: true },
        { text: language === 'ar' ? 'طلبات مهجورة غير محدودة' : 'Unlimited Abandoned orders', included: true },
        { text: language === 'ar' ? 'إدارة العملات' : 'Currency Management', included: true },
        { text: language === 'ar' ? 'جوجل شيتس' : 'Google Sheets', included: true },
        { text: language === 'ar' ? 'بكسلات وسائل التواصل المتعددة' : 'Multi Social media Pixels', included: true },
        { text: language === 'ar' ? 'عروض الكمية + تصميم مخصص' : 'Quantity offers + Customized design', included: true },
        { text: language === 'ar' ? 'البيع الإضافي + تصميم مخصص' : 'Upsell + Customized design', included: true },
        { text: language === 'ar' ? 'أسعار الشحن' : 'Shipping Rates', included: true },
        { text: language === 'ar' ? 'دعم 24x7' : '24x7 Support', included: true },
        { text: language === 'ar' ? 'جميع الميزات الجديدة مشمولة' : 'All new features included', included: true }
      ]
    }
  ];


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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 mb-6">
              <Sparkles className="h-4 w-4" />
              {language === 'ar' ? 'خطط مرنة لجميع الأحجام' : 'Flexible plans for every size'}
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
              {language === 'ar' ? 'اختر الخطة المثالية' : 'Choose Your Perfect Plan'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {language === 'ar'
                ? 'ابدأ مجاناً واستمتع بجميع الميزات الأساسية، ثم قم بالترقية عندما تحتاج إلى المزيد'
                : 'Start free with all essential features, then upgrade when you need more power and flexibility'}
            </p>
          </div>

          {/* Current Subscription Banner */}
          {subscription && (
            <div className="mb-10 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
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
                      <span>{subscription.status}</span>
                      {subscription.next_billing_date && (
                        <>
                          <span className="mx-2">•</span>
                          <span>
                            {language === 'ar' ? 'يتجدد في' : 'Renews'} {new Date(subscription.next_billing_date).toLocaleDateString(language === 'ar' ? 'ar' : 'en')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {subscription.status === 'pending' && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    {language === 'ar' ? 'قيد التفعيل' : 'Activating'}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Pricing Toggle - Future Enhancement */}
            {/* <div className="lg:col-span-3 flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-lg">
                <button className="px-4 py-2 rounded-md bg-white shadow-sm text-sm font-medium">Monthly</button>
                <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600">Yearly (Save 20%)</button>
              </div>
            </div> */}
            {plans.map((plan) => {
              const isCurrentPlanActive = isCurrentPlan(plan.id as PlanId);
              const isUpgrading = upgradingTo === (plan.id as PlanId);

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    plan.popular
                      ? 'border-2 border-purple-300 shadow-lg transform hover:scale-105'
                      : 'border border-gray-200 hover:border-gray-300'
                  } ${isCurrentPlanActive ? 'ring-2 ring-emerald-400' : ''}`}
                >
                  {/* Background - إزالة الطبقة الشفافة المشوشة */}

                  {/* إزالة شارة Most Popular */}

                  {/* Current Plan Badge */}
                  {isCurrentPlanActive && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {language === 'ar' ? 'خطتك الحالية' : 'Current Plan'}
                      </Badge>
                    </div>
                  )}

                  <div className="relative z-10">
                    <CardHeader className="text-center pb-6">
                      <div className="flex justify-center mb-4">
                        {(() => {
                          const Icon = iconForPlan[plan.id as PlanId];
                          return (
                            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                              plan.popular ? 'bg-purple-100' : 'bg-gray-100'
                            }`}>
                              <Icon size={28} className={plan.popular ? 'text-purple-600' : 'text-gray-600'} />
                            </div>
                          );
                        })()}
                      </div>

                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </CardTitle>

                      <div className="text-sm text-gray-600 mb-4">
                        {plan.subtitle}
                      </div>

                      <div className="mb-6">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className={`text-4xl font-bold ${
                            plan.popular ? 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent' : 'text-gray-900'
                          }`}>
                            ${plan.price}
                          </span>
                          <span className="text-gray-600 font-medium">
                            /{language === 'ar' ? 'شهر' : 'month'}
                          </span>
                        </div>
                        {plan.id === 'free' && (
                          <div className="text-xs text-emerald-600 font-medium mt-1">
                            {language === 'ar' ? 'مجاني إلى الأبد' : 'Free forever'}
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Features List - عرض جميع الميزات */}
                      <div className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                                plan.popular ? 'bg-purple-100' : 'bg-emerald-100'
                              }`}>
                                <Check className={`h-3 w-3 ${
                                  plan.popular ? 'text-purple-600' : 'text-emerald-600'
                                }`} />
                              </div>
                            </div>
                            <span className="text-sm text-gray-700 leading-relaxed">
                              {feature.text}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      <div className="pt-6">
                        <Button
                          className={`w-full h-12 font-semibold transition-all duration-300 transform hover:scale-105 ${
                            plan.popular
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                              : isCurrentPlanActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default hover:scale-100'
                                : plan.id === 'free'
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg'
                                  : 'border-2 border-gray-300 hover:border-purple-400 bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                          }`}
                          disabled={isUpgrading || isCurrentPlanActive}
                          variant="ghost"
                          onClick={() => !isCurrentPlanActive && startUpgrade(plan.id as PlanId)}
                        >
                          {isCurrentPlanActive
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
                                : (plan.id === 'free'
                                    ? (
                                      <div className="flex items-center gap-2">
                                        <Gift className="h-4 w-4" />
                                        {language === 'ar' ? 'ابدأ مجاناً' : 'Get Started Free'}
                                      </div>
                                    )
                                    : (
                                      <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4" />
                                        {language === 'ar' ? 'ترقية إلى ' + plan.name : 'Upgrade to ' + plan.name}
                                      </div>
                                    )))}
                        </Button>

                        {/* Additional CTA for popular plan */}
                        {plan.popular && !isCurrentPlanActive && (
                          <div className="text-center mt-3">
                            <span className="text-xs text-purple-600 font-medium">
                              {language === 'ar' ? '⭐ الخيار الأكثر شعبية' : '⭐ Most popular choice'}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* FAQ & Support Section */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {language === 'ar' ? 'لديك أسئلة؟' : 'Have Questions?'}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                {language === 'ar'
                  ? 'فريقنا المتخصص جاهز لمساعدتك في اختيار الخطة المثالية لاحتياجاتك'
                  : 'Our expert team is ready to help you choose the perfect plan for your needs'}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="outline"
                  className="bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3"
                  onClick={() => navigate('/contact')}
                >
                  {language === 'ar' ? 'تواصل معنا' : 'Contact Support'}
                </Button>
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-800 px-6 py-3"
                  onClick={() => navigate('/dashboard')}
                >
                  {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
                </Button>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 text-center">
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
      </div>
    </div>
  );
};

export default Plans;