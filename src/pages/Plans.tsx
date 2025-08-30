import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS, type PlanId } from '@/lib/billing/plans';
import UnifiedStoreManager from '@/utils/unified-store-manager';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, Shield, Clock, Users, Headphones } from "lucide-react";



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

  

  const iconForPlan: Record<PlanId, React.ComponentType<any>> = {
    free: Star,
    basic: Zap,
    premium: Crown,
  };

  const getCardStyle = (planId: PlanId) => {
    if (planId === 'premium') {
      return "relative overflow-hidden border-2 border-primary bg-gradient-to-br from-primary/5 via-primary/10 to-primary/15 shadow-xl hover:shadow-2xl transition-all duration-500 scale-105 hover:scale-110";
    }
    return "relative overflow-hidden border border-border bg-card hover:shadow-xl transition-all duration-300 hover:scale-105";
  };

  const getPriceColor = (planId: PlanId) => {
    if (planId === 'free') return "text-emerald-600";
    if (planId === 'basic') return "text-primary";
    if (planId === 'premium') return "text-primary";
    return "text-foreground";
  };

  const getButtonVariant = (planId: PlanId) => {
    if (isCurrentPlan(planId)) return 'secondary';
    if (planId === 'premium') return 'default';
    return 'outline';
  };

  return (
    <div className="flex min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />

      <div className="flex-1">
        <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-primary/5">
          <div className="max-w-7xl mx-auto px-6 py-16">
            
            {/* Header Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full text-sm font-semibold mb-8 shadow-lg">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                {language === 'ar' ? 'خطط الاشتراك' : 'Pricing Plans'}
              </div>
              
              <h1 className="text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent leading-tight">
                {language === 'ar' ? 'اختر خطتك المثالية' : 'Choose Your Perfect Plan'}
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
                {language === 'ar'
                  ? 'خطط مرنة تنمو مع نشاطك التجاري. ابدأ مجاناً وارتقِ عند الحاجة'
                  : 'Flexible plans that scale with your business. Start free and upgrade when you need more power'}
              </p>

              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>{language === 'ar' ? 'أمان مضمون' : 'Secure & Reliable'}</span>
                </div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>{language === 'ar' ? 'دعم 24/7' : '24/7 Support'}</span>
                </div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>{language === 'ar' ? 'آلاف العملاء' : 'Thousands of Users'}</span>
                </div>
              </div>
            </div>

            {/* Current Subscription Banner */}
            {subscription && (
              <div className="mb-12 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700 p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200 capitalize">
                        {subscription.plan_type} {language === 'ar' ? 'خطة' : 'Plan'}
                      </div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-400">
                        {language === 'ar' ? 'حالة:' : 'Status:'} {subscription.status}
                      </div>
                    </div>
                  </div>
                  
                  {subscription.status === 'pending' && (
                    <Badge className="bg-amber-100 text-amber-800 px-4 py-2">
                      {language === 'ar' ? 'قيد التفعيل' : 'Activating'}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Plans Grid */}
            <div className="grid lg:grid-cols-3 gap-8 mb-16">
              {plans.map((plan) => {
                const Icon = iconForPlan[plan.id as PlanId];
                const isPremium = plan.id === 'premium';
                
                return (
                  <Card key={plan.id} className={getCardStyle(plan.id as PlanId)}>
                    {isPremium && (
                      <>
                        <div className="absolute -top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary"></div>
                        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                          <Badge className="bg-primary text-primary-foreground px-6 py-2 text-sm font-bold shadow-xl">
                            <Crown className="h-4 w-4 mr-2 fill-current" />
                            {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                          </Badge>
                        </div>
                      </>
                    )}

                    <CardHeader className="text-center pb-6 pt-10">
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <div className={`p-4 rounded-2xl ${isPremium ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted text-primary'}`}>
                          <Icon size={32} />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black">{plan.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1 font-medium">
                            {planSubtitle[plan.id as PlanId]}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className={`text-6xl font-black ${getPriceColor(plan.id as PlanId)}`}>
                            ${plan.price}
                          </span>
                          <span className="text-lg text-muted-foreground font-semibold">
                            /{language === 'ar' ? 'شهر' : 'month'}
                          </span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-8 px-8 pb-10">
                      {/* Monthly Limits */}
                      <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-6 border shadow-inner">
                        <h4 className="font-bold text-lg mb-4 text-center">
                          {language === 'ar' ? 'الحدود الشهرية' : 'Monthly Limits'}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 rounded-xl bg-background/50 border">
                            <div className="font-black text-2xl text-primary">
                              {plan.limits.orders ? plan.limits.orders.toLocaleString() : '∞'}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">
                              {language === 'ar' ? 'طلبات' : 'Orders'}
                            </div>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-background/50 border">
                            <div className="font-black text-2xl text-primary">
                              {plan.limits.abandoned ? plan.limits.abandoned.toLocaleString() : '∞'}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">
                              {language === 'ar' ? 'سلال مهجورة' : 'Abandoned'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-lg text-center">
                          {language === 'ar' ? 'الميزات المتضمنة' : 'What\'s Included'}
                        </h4>
                        {plan.features.slice(0, 6).map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            </div>
                            <span className="text-sm leading-relaxed font-medium">{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 6 && (
                          <div className="text-sm text-muted-foreground text-center pt-2">
                            +{plan.features.length - 6} {language === 'ar' ? 'ميزة أخرى' : 'more features'}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="pt-6">
                        <Button
                          className={`w-full h-14 text-lg font-bold rounded-xl transition-all duration-300 ${
                            isPremium ? 'shadow-xl hover:shadow-2xl bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90' : ''
                          }`}
                          disabled={upgradingTo === (plan.id as PlanId) || isCurrentPlan(plan.id as PlanId)}
                          variant={getButtonVariant(plan.id as PlanId)}
                          onClick={() => startUpgrade(plan.id as PlanId)}
                        >
                          {isCurrentPlan(plan.id as PlanId)
                            ? (subscription?.status === 'pending'
                                ? (language === 'ar' ? 'قيد التفعيل...' : 'Activating...')
                                : (language === 'ar' ? 'الخطة الحالية' : 'Current Plan'))
                            : (upgradingTo === (plan.id as PlanId)
                                ? (language === 'ar' ? 'جاري الترقية...' : 'Upgrading...')
                                : (plan.id === 'free' 
                                    ? (language === 'ar' ? 'ابدأ مجاناً' : 'Get Started Free')
                                    : (language === 'ar' ? `ترقية إلى ${plan.name}` : `Upgrade to ${plan.name}`)))}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Trust Indicators */}
            <div className="grid md:grid-cols-4 gap-6 mb-16">
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700">
                <Shield className="h-10 w-10 text-emerald-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">
                  {language === 'ar' ? 'أمان عالي' : 'Enterprise Security'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'حماية متقدمة للبيانات' : 'Advanced data protection'}
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700">
                <Headphones className="h-10 w-10 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">
                  {language === 'ar' ? 'دعم مستمر' : '24/7 Expert Support'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'فريق متخصص متاح دائماً' : 'Expert team always available'}
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700">
                <Users className="h-10 w-10 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">
                  {language === 'ar' ? 'آلاف العملاء' : 'Trusted by Thousands'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'يثق بنا آلاف العملاء' : 'Join thousands of satisfied users'}
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700">
                <Star className="h-10 w-10 text-amber-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">
                  {language === 'ar' ? 'ميزات حصرية' : 'Premium Features'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'أحدث التقنيات والميزات' : 'Latest features and technology'}
                </p>
              </div>
            </div>

            {/* FAQ/Contact Section */}
            <div className="text-center bg-gradient-to-r from-muted/30 to-muted/20 rounded-3xl p-12 border shadow-xl">
              <h3 className="text-4xl font-black mb-6">
                {language === 'ar' ? 'لديك أسئلة؟' : 'Have Questions?'}
              </h3>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                {language === 'ar'
                  ? 'فريقنا المتخصص جاهز لمساعدتك في اختيار الخطة المثالية لنشاطك التجاري'
                  : 'Our expert team is ready to help you choose the perfect plan for your business needs'}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/contact')}
                  className="gap-3 h-14 px-8 text-lg font-bold rounded-xl"
                >
                  <Headphones className="h-6 w-6" />
                  {language === 'ar' ? 'تواصل معنا الآن' : 'Contact Us Now'}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/dashboard')}
                  className="gap-3 h-14 px-8 text-lg font-bold rounded-xl"
                >
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