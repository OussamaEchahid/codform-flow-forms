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
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // اجلب المتاجر (إن وجدت) لكن لا تربط جلب الاشتراك بوجودها
      const { data: storesData } = await getUserStores();
      setStores(storesData || []);

      // جلب اشتراك المتجر النشط باستخدام النظام الموحد
      const activeStore = UnifiedStoreManager.getActiveStore()
        || localStorage.getItem('active_store')
        || localStorage.getItem('active_shopify_store')
        || localStorage.getItem('shopify_store');

      if (activeStore) {
        const { data: subscriptionData } = await getShopSubscription(activeStore);
        setCurrentSubscription(subscriptionData);
      } else {
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('❌ Error loading subscription data:', error);
    } finally {
      setLoading(false);
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

          // ابدأ Polling للتحقق من تفعيل الخطة الجديدة وإظهار العلامة فوراً
          if (upgradePollRef.current) {
            window.clearInterval(upgradePollRef.current);
            upgradePollRef.current = null;
          }
          const pollId = window.setInterval(async () => {
            const { data: latest } = await getShopSubscription(activeStore);
            if (latest?.plan_type === planId) {
              setCurrentSubscription(latest);
              setUpgradingTo(null);
              window.clearInterval(pollId);
              upgradePollRef.current = null;
              const { toast } = await import('@/hooks/use-toast');
              toast.success(language === 'ar' ? 'تم تفعيل الخطة بنجاح' : 'Plan activated successfully');
            }
          }, 4000);
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
    return currentSubscription?.plan_type || null;
  };

  const getPlanStatus = (planId: string) => {
    const currentPlan = getCurrentPlan();
    if (!currentPlan) return 'other'; // غير معروف حتى يتم جلب الاشتراك
    if (currentPlan === planId) return 'current';

    const planOrder = ['free', 'basic', 'premium'];
    const currentIndex = planOrder.indexOf(currentPlan);
    const planIndex = planOrder.indexOf(planId);

    return planIndex > currentIndex ? 'upgrade' : 'downgrade';
  };

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

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative transition-all duration-300 hover:shadow-xl",
                  plan.popular && "border-primary shadow-xl scale-105 bg-gradient-to-br from-background to-muted/30",
                  status === 'current' && "ring-2 ring-primary"
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
                {status === 'current' && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-green-600 text-white flex items-center gap-1">
                      <Check className="h-4 w-4" /> {language === 'ar' ? 'مشترك' : 'Subscribed'}
                    </Badge>
                  </div>
                )}
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
                  {status === 'current' && (
                    <Badge variant="secondary" className="mt-2">{language === 'ar' ? 'الخطة الحالية' : 'Current Plan'}</Badge>
                  )}
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
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {status === 'current'
                      ? (language === 'ar' ? 'الخطة الحالية' : 'Current Plan')
                      : upgradingTo === plan.id
                        ? (language === 'ar' ? 'جاري الترقية...' : 'Upgrading...')
                        : plan.buttonText}
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