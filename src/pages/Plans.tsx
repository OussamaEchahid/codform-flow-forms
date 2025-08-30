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
import { Crown, Star, Zap, Check } from "lucide-react";



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

  const iconForPlan: Record<PlanId, React.ComponentType<any>> = {
    free: Star,
    basic: Zap,
    premium: Crown,
  };

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

  const handleUpgrade = (planName: string) => {}

  return (
    <div className="flex min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* العنوان */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              {language === 'ar' ? 'اختر الخطة المناسبة لك' : 'Choose Your Perfect Plan'}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {language === 'ar'
                ? 'ابدأ مجاناً وقم بالترقية عندما تحتاج لمزيد من الميزات والحدود'
                : 'Start free and upgrade when you need more features and limits'
              }
            </p>
          </div>

          {/* بطاقات الخطط */}
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Star className="h-4 w-4 mr-1" />
                      {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    {(() => { const Icon = iconForPlan[plan.id as PlanId]; return <Icon size={20} className="text-primary" />; })()}
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{language === 'ar' ? 'شهر' : 'month'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {planSubtitle[plan.id as PlanId]}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* الحدود */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-semibold mb-2">
                      {language === 'ar' ? 'الحدود الشهرية:' : 'Monthly Limits:'}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'الطلبات:' : 'Orders:'}</span>
                        <span className="font-medium">
                          {plan.limits.orders ? plan.limits.orders.toLocaleString() : '∞'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'السلال المهجورة:' : 'Abandoned Carts:'}</span>
                        <span className="font-medium">
                          {plan.limits.abandoned ? plan.limits.abandoned.toLocaleString() : '∞'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* الميزات */}

                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* زر الاشتراك */}
                  <Button
                    className="w-full"
                    disabled={upgradingTo === (plan.id as PlanId) || (isCurrentPlan(plan.id as PlanId))}
                    variant={isCurrentPlan(plan.id as PlanId) ? 'secondary' : (plan.popular ? 'default' : 'outline')}
                    onClick={() => startUpgrade(plan.id as PlanId)}
                  >
                    {isCurrentPlan(plan.id as PlanId)
                      ? (subscription?.status === 'pending'
                          ? (language === 'ar' ? 'قيد التفعيل...' : 'Activating...')
                          : (language === 'ar' ? 'الخطة الحالية' : 'Current Plan'))
                      : (upgradingTo === (plan.id as PlanId)
                          ? (language === 'ar' ? 'جاري الترقية...' : 'Upgrading...')
                          : (language === 'ar' ? 'اختر الخطة' : 'Choose plan'))}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* معلومات إضافية */}
          <div className="mt-12 text-center">
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">
                {language === 'ar' ? 'لديك أسئلة؟' : 'Have Questions?'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'ar'
                  ? 'فريقنا هنا لمساعدتك في اختيار الخطة المناسبة'
                  : 'Our team is here to help you choose the right plan'
                }
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => navigate('/contact')}>
                  {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                </Button>
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                  {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;