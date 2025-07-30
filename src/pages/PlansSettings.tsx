import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, Check, X } from "lucide-react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { getUserStores, getShopSubscription } from "@/lib/supabase-with-email";

const PlansSettings = () => {
  const { t } = useI18n();
  const [stores, setStores] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const plans = [
    {
      id: 'free',
      name: 'Free / مجاني',
      nameKey: 'freePlan',
      price: '$0',
      icon: Star,
      description: 'للمشاريع الصغيرة والبداية',
      features: [
        'حتى 5 نماذج',
        '100 طلب شهرياً',
        'دعم أساسي',
        'تخزين 1GB'
      ],
      limits: { forms: 5, orders: 100, storage: '1GB' },
      current: true
    },
    {
      id: 'basic',
      name: 'Basic / أساسي',
      nameKey: 'basicPlan',
      price: '$9.99',
      icon: Zap,
      description: 'للشركات الصغيرة المتنامية',
      popular: true,
      features: [
        'حتى 20 نموذج',
        '1,000 طلب شهرياً',
        'دعم متقدم',
        'تخزين 10GB',
        'تحليلات أساسية'
      ],
      limits: { forms: 20, orders: 1000, storage: '10GB' }
    },
    {
      id: 'premium',
      name: 'Premium / متقدم',
      nameKey: 'premiumPlan', 
      price: '$29.99',
      icon: Crown,
      description: 'للشركات المتوسطة والمتنامية',
      features: [
        'نماذج غير محدودة',
        '10,000 طلب شهرياً',
        'دعم أولوية',
        'تخزين 50GB',
        'تحليلات متقدمة',
        'تخصيص المظهر'
      ],
      limits: { forms: 'unlimited', orders: 10000, storage: '50GB' }
    },
    {
      id: 'unlimited',
      name: 'Unlimited / غير محدود',
      nameKey: 'unlimitedPlan',
      price: '$99.99',
      icon: Crown,
      description: 'للشركات الكبيرة والمؤسسات',
      features: [
        'نماذج غير محدودة',
        'طلبات غير محدودة',
        'دعم 24/7',
        'تخزين 500GB',
        'تحليلات احترافية',
        'API مخصص',
        'Shopify Partners Integration'
      ],
      limits: { forms: 'unlimited', orders: 'unlimited', storage: '500GB' }
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

  const handleUpgrade = (planId: string) => {
    console.log(`🔄 Upgrading to plan: ${planId}`);
    // TODO: إضافة منطق الترقية مع Shopify Partners
  };

  const getCurrentPlan = () => {
    return currentSubscription?.plan_type || 'free';
  };

  const getPlanStatus = (planId: string) => {
    const currentPlan = getCurrentPlan();
    if (currentPlan === planId) return 'current';
    
    const planOrder = ['free', 'basic', 'premium', 'unlimited'];
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const status = getPlanStatus(plan.id);
            const IconComponent = plan.icon;
            
            return (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary' : ''} ${status === 'current' ? 'ring-2 ring-green-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Badge className="bg-primary text-primary-foreground">الأكثر شعبية</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      {plan.name}
                    </CardTitle>
                    {status === 'current' && (
                      <Badge variant="secondary">الخطة الحالية</Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-2xl font-bold">{plan.price}/شهر</div>
                  
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    disabled={status === 'current'}
                    variant={status === 'current' ? 'secondary' : 'default'}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {status === 'current' ? 'الخطة الحالية' : 
                     status === 'upgrade' ? 'ترقية' : 'تنزيل'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* إحصائيات الاستخدام */}
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الاستخدام الحالي</CardTitle>
            <CardDescription>استخدامك للخطة الحالية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">النماذج المستخدمة</div>
                <div className="text-2xl font-bold">3/5</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">الطلبات هذا الشهر</div>
                <div className="text-2xl font-bold">47/100</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">المساحة المستخدمة</div>
                <div className="text-2xl font-bold">0.3/1 GB</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">تاريخ التجديد</div>
                <div className="text-2xl font-bold">
                  {currentSubscription?.next_billing_date ? 
                    new Date(currentSubscription.next_billing_date).toLocaleDateString('ar-SA') : 
                    '--'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default PlansSettings;