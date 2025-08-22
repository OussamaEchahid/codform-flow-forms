import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, Check, X } from "lucide-react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState, useRef } from "react";
import { getUserStores, getShopSubscription } from "@/lib/supabase-with-email";
import { cn } from "@/lib/utils";

import UnifiedStoreManager from "@/utils/unified-store-manager";
const PlansSettings = () => {
  const { t, language } = useI18n();
  const [stores, setStores] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // تتبع حالة الترقية حتى نُظهر علامة واضحة ونمنع النقرات المكررة
  const [upgradingTo, setUpgradingTo] = useState<string | null>(null);
  const upgradePollRef = useRef<number | null>(null);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      nameKey: 'freePlan',
      price: '$0',
      icon: Star,
      description: language === 'ar' ? 'مثالي للبدء' : 'Perfect for getting started',
      features: [
        language === 'ar' ? '70 طلب شهرياً' : '70 Orders/mo',
        language === 'ar' ? 'تصميم نماذج مخصص لكل منتج' : 'Custom form design for each product',
        language === 'ar' ? 'منشئ صفحات الهبوط' : 'Landing page builder',
        language === 'ar' ? '30 سلة مهجورة' : '30 Abandoned checkouts',
        language === 'ar' ? 'إدارة العملات' : 'Currency Management',
        language === 'ar' ? 'جداول بيانات Google' : 'Google Sheets',
        language === 'ar' ? 'بيكسلات وسائل التواصل الاجتماعي' : 'Multi Social media Pixels',
        language === 'ar' ? 'عروض الكمية + تصميم مخصص' : 'Quantity offers + Customized design',
        language === 'ar' ? 'البيع الإضافي + تصميم مخصص' : 'Upsell + Customized design',
        language === 'ar' ? 'أسعار الشحن' : 'Shipping Rates',
        language === 'ar' ? 'دعم 24/7' : '24x7 Support'
      ],
      // زر الخطة المجانية يجب أن يظهر للبدء، وليس "الخطة الحالية" بشكل افتراضي
      buttonText: language === 'ar' ? 'البدء مجاناً' : 'Get Started',
      popular: false
    },
    {
      id: 'basic',
      name: 'Basic',
      nameKey: 'basicPlan',
      price: '$11.85',
      icon: Zap,
      description: language === 'ar' ? 'رائع للأعمال الصغيرة' : 'Great for small businesses',
      popular: false,
      features: [
        language === 'ar' ? '1000 طلب شهرياً' : '1000 Orders/mo',
        language === 'ar' ? 'تصميم نماذج مخصص لكل منتج' : 'Custom form design for each product',
        language === 'ar' ? 'منشئ صفحات الهبوط' : 'Landing page builder',
        language === 'ar' ? '30 سلة مهجورة' : '30 Abandoned checkouts',
        language === 'ar' ? 'إدارة العملات' : 'Currency Management',
        language === 'ar' ? 'جداول بيانات Google' : 'Google Sheets',
        language === 'ar' ? 'بيكسلات وسائل التواصل الاجتماعي' : 'Multi Social media Pixels',
        language === 'ar' ? 'عروض الكمية + تصميم مخصص' : 'Quantity offers + Customized design',
        language === 'ar' ? 'البيع الإضافي + تصميم مخصص' : 'Upsell + Customized design',
        language === 'ar' ? 'أسعار الشحن' : 'Shipping Rates',
        language === 'ar' ? 'دعم 24/7' : '24x7 Support'
      ],
      buttonText: language === 'ar' ? 'ترقية للأساسية' : 'Upgrade to Basic'
    },
    {
      id: 'premium',
      name: 'Premium',
      nameKey: 'premiumPlan',
      price: '$22.85',
      icon: Crown,
      description: language === 'ar' ? 'الأفضل للفرق النامية' : 'Best for growing teams',
      popular: true,
      features: [
        language === 'ar' ? 'طلبات غير محدودة شهرياً' : 'Unlimited Orders/mo',
        language === 'ar' ? 'تصميم نماذج مخصص لكل منتج' : 'Custom form design for each product',
        language === 'ar' ? 'منشئ صفحات الهبوط' : 'Landing page builder',
        language === 'ar' ? 'طلبات مهجورة غير محدودة' : 'Unlimited Abandoned orders',
        language === 'ar' ? 'إدارة العملات' : 'Currency Management',
        language === 'ar' ? 'جداول بيانات Google' : 'Google Sheets',
        language === 'ar' ? 'بيكسلات وسائل التواصل الاجتماعي' : 'Multi Social media Pixels',
        language === 'ar' ? 'عروض الكمية + تصميم مخصص' : 'Quantity offers + Customized design',
        language === 'ar' ? 'البيع الإضافي + تصميم مخصص' : 'Upsell + Customized design',
        language === 'ar' ? 'أسعار الشحن' : 'Shipping Rates',
        language === 'ar' ? 'دعم 24/7' : '24x7 Support',
        language === 'ar' ? 'جميع الميزات الجديدة مضمنة' : 'All new features included'
      ],
      buttonText: language === 'ar' ? 'ترقية للمتقدمة' : 'Upgrade to Premium'
    }
  ];

  useEffect(() => {
    loadData();
    // تنظيف أي polling عند الخروج من الصفحة
    return () => {
      if (upgradePollRef.current) {
        window.clearInterval(upgradePollRef.current);
        upgradePollRef.current = null;
      }
      // تنظيف event listeners
      window.removeEventListener('focus', () => {});
      window.removeEventListener('message', () => {});
    };
  }, []);

  const loadData = async () => {
    console.log('🔄 loadData: Starting to load subscription data...');
    try {
      setLoading(true);
      // اجلب المتاجر (إن وجدت) لكن لا تربط جلب الاشتراك بوجودها
      const { data: storesData } = await getUserStores();
      console.log('🏪 loadData: Stores data:', storesData);
      setStores(storesData || []);

      // جلب اشتراك المتجر النشط باستخدام النظام الموحد + مفاتيح محلية احتياطية
      const activeStore =
        UnifiedStoreManager.getActiveStore() ||
        localStorage.getItem('active_store') ||
        localStorage.getItem('active_shop') ||
        localStorage.getItem('active_shopify_store') ||
        localStorage.getItem('shopify_store') ||
        (storesData && storesData[0]?.shop) ||
        stores[0]?.shop;

      console.log('🎯 loadData: Active store:', activeStore);

      if (activeStore) {
        const { data: subscriptionData } = await getShopSubscription(activeStore);
        console.log('📦 loadData: Subscription data received:', subscriptionData);
        setCurrentSubscription(subscriptionData);
      } else {
        console.log('❌ loadData: No active store found');
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('❌ Error loading subscription data:', error);
    } finally {
      setLoading(false);
      console.log('✅ loadData: Finished loading');
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      const activeStore =
        UnifiedStoreManager.getActiveStore() ||
        localStorage.getItem('active_store') ||
        localStorage.getItem('active_shop') ||
        localStorage.getItem('active_shopify_store') ||
        localStorage.getItem('shopify_store') ||
        stores[0]?.shop;

      if (!activeStore) {
        console.error('لا يوجد متجر نشط');
        return;
      }

      setUpgradingTo(planId);

      if (planId === 'free') {
        // تغيير الخطة إلى مجاني مباشرة
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await (supabase as any)
          .rpc('upgrade_shop_plan', { p_shop_domain: activeStore, p_new_plan: 'free' });
        if (error) throw error;
        console.log('✅ تم تحديث الخطة إلى مجاني');
        await loadData();
        setUpgradingTo(null);
      } else {
        // إنشاء اشتراك عبر Shopify وإرجاع رابط التأكيد مع معالجة رسائل الأخطاء
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.functions.invoke('change-plan', {
          body: { shop: activeStore, planId }
        });

        if (error) {
          // حاول استخراج تفاصيل مفيدة من الخطأ القادم من Edge Function
          const errMsg = (error as any)?.message || 'حدث خطأ أثناء إنشاء الاشتراك';
          try {
            const payload = JSON.parse(errMsg);
            if (payload?.details?.length) {
              const messages = payload.details.map((d: any) => d.message).join(' — ');
              const { toast } = await import('@/hooks/use-toast');
              toast.error(messages);
            }
          } catch {
            const { toast } = await import('@/hooks/use-toast');
            toast.error(errMsg);
          }
          throw error;
        }

        if (data?.url) {
          const { toast } = await import('@/hooks/use-toast');
          toast.info('سيتم فتح صفحة تأكيد الرسوم في Shopify. يرجى الموافقة لإكمال الترقية.');
          window.open(data.url, '_blank');

          // تحديث فوري بعد عودة التركيز
          const onFocus = async () => {
            await loadData();
            window.removeEventListener('focus', onFocus);
          };
          window.addEventListener('focus', onFocus);

          // استمع لرسائل من النافذة المنبثقة
          let messageReceived = false;
          const onMessage = async (event: MessageEvent) => {
            console.log('📨 Received message:', event.data);
            if (event.data?.type === 'SUBSCRIPTION_SUCCESS' && !messageReceived) {
              messageReceived = true;
              console.log('✅ Processing subscription success message:', event.data);

              // إيقاف polling إذا كان يعمل
              if (upgradePollRef.current) {
                window.clearInterval(upgradePollRef.current);
                upgradePollRef.current = null;
              }

              // تحديث فوري للاشتراك الحالي
              const newSubscription = {
                id: 'temp-' + Date.now(),
                shop_domain: event.data.shop || activeStore,
                plan_type: event.data.plan !== 'unknown' ? event.data.plan : planId,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              console.log('🔄 Setting current subscription:', newSubscription);
              setCurrentSubscription(newSubscription);
              setUpgradingTo(null);

              // فرض إعادة رسم المكون
              setTimeout(() => {
                setCurrentSubscription((prev: any) => ({ ...prev, updated_at: new Date().toISOString() }));
              }, 100);

              // تحديث البيانات من قاعدة البيانات
              setTimeout(async () => {
                console.log('🔄 Reloading data from database...');
                await loadData();
              }, 1000);

              const { toast } = await import('@/hooks/use-toast');
              toast.success(language === 'ar' ? 'تم تفعيل الخطة بنجاح' : 'Plan activated successfully');

              // إزالة event listener بعد تأخير
              setTimeout(() => {
                window.removeEventListener('message', onMessage);
              }, 2000);
            }
          };
          window.addEventListener('message', onMessage);

          // ابدأ Polling للتحقق من تفعيل الخطة الجديدة وإظهار العلامة فوراً
          if (upgradePollRef.current) {
            window.clearInterval(upgradePollRef.current);
            upgradePollRef.current = null;
          }

          let pollAttempts = 0;
          const maxPollAttempts = 30; // 30 attempts * 4 seconds = 2 minutes max

          const pollId = window.setInterval(async () => {
            pollAttempts++;
            console.log(`🔄 Polling attempt ${pollAttempts}/${maxPollAttempts} for plan ${planId}`);

            try {
              const { data: latest } = await getShopSubscription(activeStore);
              console.log('📊 Current subscription data:', latest);

              // Check if subscription matches the plan (regardless of status for now)
              if (latest?.plan_type === planId) {
                console.log('✅ Subscription found with correct plan!');
                setCurrentSubscription(latest);
                setUpgradingTo(null);
                window.clearInterval(pollId);
                upgradePollRef.current = null;
                const { toast } = await import('@/hooks/use-toast');
                toast.success(language === 'ar' ? 'تم تفعيل الخطة بنجاح' : 'Plan activated successfully');
                return;
              }
            } catch (error) {
              console.error('❌ Error during polling:', error);
            }

            // Stop polling after max attempts
            if (pollAttempts >= maxPollAttempts) {
              console.log('⏰ Polling timeout reached');
              window.clearInterval(pollId);
              upgradePollRef.current = null;
              setUpgradingTo(null);
            }
          }, 3000); // Reduced to 3 seconds for faster response
          upgradePollRef.current = pollId;
        } else if ((data as any)?.details?.length) {
          const messages = (data as any).details.map((d: any) => d.message).join(' — ');
          const { toast } = await import('@/hooks/use-toast');
          toast.error(messages);
        }
      }
    } catch (e) {
      console.error('❌ خطأ في ترقية الخطة:', e);
    }
  };

  const getCurrentPlan = () => {
    // لا تُرجِع Free كافتراض حتى لا تُعلم البطاقة مجانًا كخطة حالية بدون بيانات
    const plan = currentSubscription?.plan_type || null;
    console.log('🔍 getCurrentPlan:', plan, 'from subscription:', currentSubscription);
    return plan;
  };

  const getPlanStatus = (planId: string) => {
    const currentPlan = getCurrentPlan();
    console.log(`🔍 getPlanStatus for ${planId}: currentPlan=${currentPlan}`);

    if (!currentPlan) return 'other'; // غير معروف حتى يتم جلب الاشتراك
    if (currentPlan === planId) {
      console.log(`✅ Plan ${planId} is CURRENT`);
      return 'current';
    }

    const planOrder = ['free', 'basic', 'premium'];
    const currentIndex = planOrder.indexOf(currentPlan);
    const planIndex = planOrder.indexOf(planId);

    const status = planIndex > currentIndex ? 'upgrade' : 'downgrade';
    console.log(`📊 Plan ${planId} status: ${status}`);
    return status;
  };

  // Log current state for debugging
  console.log('🔍 PlansSettings render - Current subscription:', currentSubscription);
  console.log('🔍 PlansSettings render - Loading:', loading);
  console.log('🔍 PlansSettings render - Upgrading to:', upgradingTo);

  if (loading) {
    return (
      <SettingsLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="h-8 w-8" />
              {language === 'ar' ? 'خطط الاشتراك' : 'Subscription Plans'}
            </h1>
            <p className="text-muted-foreground">{language === 'ar' ? 'اختر الخطة المناسبة لمتجرك ومتطلباتك' : 'Choose the right plan for your store and requirements'}</p>
          </div>
        </div>

        {/* عرض المتاجر */}
        {stores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'متاجرك الحالية' : 'Your Current Stores'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {stores.map((store, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                    <div>
                      <div className="font-medium">{store.shop}</div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'الخطة:' : 'Plan:'} {currentSubscription?.plan_type ?? (language === 'ar' ? 'غير معروف' : 'Unknown')}
                      </div>
                    </div>
                    <Badge variant={store.shop === (UnifiedStoreManager.getActiveStore() || localStorage.getItem('active_store')) ? 'default' : 'secondary'}>
                      {store.shop === (UnifiedStoreManager.getActiveStore() || localStorage.getItem('active_store')) ?
                        (language === 'ar' ? 'نشط' : 'Active') :
                        (language === 'ar' ? 'غير نشط' : 'Inactive')
                      }
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* الخطط */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const status = getPlanStatus(plan.id);
            const IconComponent = plan.icon;
            console.log(`🎨 Rendering plan ${plan.id} with status: ${status}`);

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative transition-all duration-300 hover:shadow-xl",
                  plan.popular && "border-primary shadow-xl scale-105 bg-gradient-to-br from-background to-muted/30",
                  (() => {
                    const isCurrent = status === 'current';
                    console.log(`🔲 Ring border for plan ${plan.id}: ${isCurrent ? 'SHOWING' : 'HIDDEN'}`);
                    return isCurrent && "ring-2 ring-primary";
                  })()
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1 text-sm font-semibold shadow-lg">
                      {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                    </Badge>
                  </div>
                )}

                {/* شارة خضراء واضحة عند كون الخطة حالية */}
                {(() => {
                  const isCurrent = status === 'current';
                  console.log(`🏷️ Green badge for plan ${plan.id}: ${isCurrent ? 'SHOWING' : 'HIDDEN'}`);
                  return isCurrent && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-green-600 text-white flex items-center gap-1">
                        <Check className="h-4 w-4" /> {language === 'ar' ? 'مشترك' : 'Subscribed'}
                      </Badge>
                    </div>
                  );
                })()}
                {/* شارة انتظار التأكيد أثناء الترقية */}
                {upgradingTo === plan.id && status !== 'current' && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-amber-500 text-white">
                      {language === 'ar' ? 'بانتظار التأكيد' : 'Awaiting confirmation'}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-2">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-primary">
                    {plan.price}
                    {plan.id !== 'free' && (
                      <span className="text-lg font-normal text-muted-foreground">
                        {language === 'ar' ? '/شهرياً' : '/month'}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {plan.description}
                  </p>
                  {(() => {
                    const isCurrent = status === 'current';
                    console.log(`🏷️ Current plan badge for plan ${plan.id}: ${isCurrent ? 'SHOWING' : 'HIDDEN'}`);
                    return isCurrent && (
                      <Badge variant="secondary" className="mt-2">{language === 'ar' ? 'الخطة الحالية' : 'Current Plan'}</Badge>
                    );
                  })()}
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn(
                      "w-full py-3 font-semibold transition-all duration-300",
                      plan.popular ? "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg" : "",
                      status === 'current' ? "bg-muted text-muted-foreground" : ""
                    )}
                    variant={status === 'current' ? 'secondary' : 'default'}
                    disabled={status === 'current' || upgradingTo === plan.id}
                    onClick={() => {
                      console.log(`🔘 Button clicked for plan ${plan.id}, status: ${status}`);
                      handleUpgrade(plan.id);
                    }}
                  >
                    {(() => {
                      const buttonText = status === 'current'
                        ? (language === 'ar' ? 'الخطة الحالية' : 'Current Plan')
                        : upgradingTo === plan.id
                          ? (language === 'ar' ? 'جاري الترقية...' : 'Upgrading...')
                          : plan.buttonText;
                      console.log(`🔘 Button text for plan ${plan.id}: ${buttonText}`);
                      return buttonText;
                    })()}
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

export default PlansSettings;