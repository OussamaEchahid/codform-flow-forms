import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import AppSidebar from '@/components/layout/AppSidebar';
import { useI18n } from '@/lib/i18n';

const Plans = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const plans = [
    {
      name: 'Free',
      price: 0,
      currency: 'USD',
      period: 'month',
      popular: false,
      features: [
        '70 طلب شهرياً',
        '30 سلة مهجورة شهرياً',
        'النماذج الأساسية',
        'دعم بريد إلكتروني',
        'تقارير أساسية'
      ],
      limits: {
        orders: 70,
        abandoned: 30
      }
    },
    {
      name: 'Basic',
      price: 9.99,
      currency: 'USD', 
      period: 'month',
      popular: true,
      features: [
        '1000 طلب شهرياً',
        '30 سلة مهجورة شهرياً',
        'جميع أنواع النماذج',
        'تكاملات متقدمة',
        'دعم أولوية',
        'تقارير مفصلة',
        'تخصيص متقدم'
      ],
      limits: {
        orders: 1000,
        abandoned: 30
      }
    },
    {
      name: 'Premium',
      price: 29.99,
      currency: 'USD',
      period: 'month',
      popular: false,
      features: [
        'طلبات غير محدودة',
        'سلال مهجورة غير محدودة',
        'جميع الميزات',
        'دعم 24/7',
        'تحليلات متقدمة',
        'API كامل',
        'تخصيص كامل',
        'نسخ احتياطية'
      ],
      limits: {
        orders: null,
        abandoned: null
      }
    }
  ];

  const handleUpgrade = (planName: string) => {
    // يمكن إضافة منطق الترقية هنا لاحقاً
    console.log('Upgrading to:', planName);
    // navigate('/checkout?plan=' + planName);
  };

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
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{language === 'ar' ? 'شهر' : 'month'}</span>
                  </div>
                  <CardDescription className="text-sm mt-2">
                    {plan.name === 'Free' && (language === 'ar' ? 'مجاني للأبد' : 'Free forever')}
                    {plan.name === 'Basic' && (language === 'ar' ? 'للأعمال النامية' : 'For growing businesses')}
                    {plan.name === 'Premium' && (language === 'ar' ? 'للشركات الكبيرة' : 'For large enterprises')}
                  </CardDescription>
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
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleUpgrade(plan.name)}
                  >
                    {plan.name === 'Free' 
                      ? (language === 'ar' ? 'البدء مجاناً' : 'Get Started')
                      : (language === 'ar' ? 'ترقية الآن' : 'Upgrade Now')
                    }
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