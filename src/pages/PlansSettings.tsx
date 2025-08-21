import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, Check, X } from "lucide-react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { getUserStores, getShopSubscription } from "@/lib/supabase-with-email";
import { cn } from "@/lib/utils";

const PlansSettings = () => {
  const { t } = useI18n();
  const [stores, setStores] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      nameKey: 'freePlan',
      price: '$0',
      icon: Star,
      description: 'Perfect for getting started',
      features: [
        '70 Orders/mo',
        'Custom form design for each product',
        'Landing page builder',
        '30 Abandoned checkouts',
        'Currency Management',
        'Google Sheets',
        'Multi Social media Pixels',
        'Quantity offers + Customized design',
        'Upsell + Customized design',
        'Shipping Rates',
        '24x7 Support'
      ],
      buttonText: 'الخطة الحالية',
      popular: false
    },
    {
      id: 'basic',
      name: 'Basic',
      nameKey: 'basicPlan',
      price: '$11.85',
      icon: Zap,
      description: 'Great for small businesses',
      popular: false,
      features: [
        '1000 Orders/mo',
        'Custom form design for each product',
        'Landing page builder',
        '30 Abandoned checkouts',
        'Currency Management',
        'Google Sheets',
        'Multi Social media Pixels',
        'Quantity offers + Customized design',
        'Upsell + Customized design',
        'Shipping Rates',
        '24x7 Support'
      ],
      buttonText: 'ترقية للأساسية'
    },
    {
      id: 'premium',
      name: 'Premium',
      nameKey: 'premiumPlan', 
      price: '$22.85',
      icon: Crown,
      description: 'Best for growing teams',
      popular: true,
      features: [
        'Unlimited Orders/mo',
        'Custom form design for each product',
        'Landing page builder',
        'Unlimited Abandoned orders',
        'Currency Management',
        'Google Sheets',
        
        'Multi Social media Pixels',
        'Quantity offers + Customized design',
        'Upsell + Customized design',
        'Shipping Rates',
        '24x7 Support',
        'All new features included'
      ],
      buttonText: 'ترقية للمتقدمة'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: storesData } = await getUserStores();
      
      if (storesData && storesData.length > 0) {
        setStores(storesData);
        
        // جلب اشتراك المتجر النشط
        const activeStore = localStorage.getItem('active_store');
        if (activeStore) {
          const { data: subscriptionData } = await getShopSubscription(activeStore);
          setCurrentSubscription(subscriptionData);
        }
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
        localStorage.getItem('active_store') ||
        localStorage.getItem('active_shop') ||
        localStorage.getItem('active_shopify_store') ||
        localStorage.getItem('shopify_store') ||
        stores[0]?.shop;

      if (!activeStore) {
        console.error('❌ لا يوجد متجر نشط');
        alert('خطأ: لا يوجد متجر نشط');
        return;
      }

      console.log('🔄 ترقية الخطة إلى:', planId, 'للمتجر:', activeStore);
      console.log('🔍 تفاصيل البيانات:', {
        activeStore,
        planId,
        activeStoreType: typeof activeStore,
        planIdType: typeof planId,
        activeStoreLength: activeStore?.length,
        planIdLength: planId?.length
      });

      if (planId === 'free') {
        // تغيير الخطة إلى مجاني مباشرة
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await (supabase as any)
          .rpc('upgrade_shop_plan', {
            p_shop_domain: activeStore,
            p_new_plan: 'free',
            p_shopify_charge_id: null
          });

        if (error) {
          console.error('❌ خطأ في تحديث الخطة:', error);
          alert(`خطأ في تحديث الخطة: ${error.message}`);
          return;
        }

        console.log('✅ تم تحديث الخطة إلى مجاني');
        alert('تم تحديث الخطة إلى المجانية بنجاح!');

        // إعادة تحميل بيانات الاشتراك
        await loadData();
      } else {
        // إنشاء اشتراك عبر Shopify وإرجاع رابط التأكيد
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.functions.invoke('change-plan', {
          body: { shop: activeStore, planId }
        });

        if (error) {
          console.error('❌ خطأ في إنشاء الاشتراك:', error);
          alert(`خطأ في إنشاء الاشتراك: ${error.message}`);
          return;
        }

        if (data?.url) {
          console.log('✅ تم إنشاء رابط التأكيد:', data.url);
          window.open(data.url, '_blank');
        } else {
          console.error('❌ لم يتم إرجاع رابط التأكيد');
          alert('خطأ: لم يتم إرجاع رابط التأكيد من Shopify');
        }
      }
    } catch (e: any) {
      console.error('❌ خطأ في ترقية الخطة:', e);
      alert(`خطأ في ترقية الخطة: ${e.message || 'خطأ غير معروف'}`);
    }
  };

  const getCurrentPlan = () => {
    return currentSubscription?.plan_type || 'free';
  };

  const getPlanStatus = (planId: string) => {
    const currentPlan = getCurrentPlan();
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
          <div className="text-center">جاري التحميل...</div>
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
              خطط الاشتراك
            </h1>
            <p className="text-muted-foreground">اختر الخطة المناسبة لمتجرك ومتطلباتك</p>
          </div>
        </div>

        {/* عرض المتاجر */}
        {stores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>متاجرك الحالية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {stores.map((store, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                    <div>
                      <div className="font-medium">{store.shop}</div>
                      <div className="text-sm text-muted-foreground">
                        الخطة: {currentSubscription?.plan_type || 'free'}
                      </div>
                    </div>
                    <Badge variant={store.shop === localStorage.getItem('active_store') ? 'default' : 'secondary'}>
                      {store.shop === localStorage.getItem('active_store') ? 'نشط' : 'غير نشط'}
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
                      الأكثر شعبية
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
                        /شهرياً
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {plan.description}
                  </p>
                  {status === 'current' && (
                    <Badge variant="secondary" className="mt-2">الخطة الحالية</Badge>
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
                    disabled={status === 'current'}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {status === 'current' ? 'الخطة الحالية' : plan.buttonText}
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