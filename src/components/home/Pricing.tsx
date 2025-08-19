
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const Pricing = () => {
  const { language, isRTL } = useI18n();

  const t = {
    heading: language === 'ar' ? 'خطط الأسعار' : 'Plans & Pricing',
    sub: language === 'ar' ? 'اختر الخطة المناسبة لاحتياجاتك مع إمكانية الترقية في أي وقت' : 'Choose the plan that fits your needs — upgrade anytime',
    mostPopular: language === 'ar' ? 'الأكثر شيوعًا' : 'Most popular',
    perMonth: language === 'ar' ? '$ / شهريًا' : '$ / month',
    selectPlan: language === 'ar' ? 'اختر الخطة' : 'Select plan',
  };

  const plans = language === 'ar' ? [
    {
      name: 'مجانية',
      price: '0',
      description: 'مثالية للبدء',
      features: [
        '70 طلبًا/شهريًا',
        'تصميم نموذج مخصص لكل منتج',
        'منشئ صفحات هبوط',
        '30 سلة مهجورة',
        'إدارة العملات',
        'Google Sheets',
        'حماية من الرسائل المزعجة',
        'بيكسلات وسائل التواصل المتعددة',
        'عروض كمية + تصميم مخصص',
        'ترقية المنتج + تصميم مخصص',
        'أسعار الشحن',
        'دعم 24/7',
      ],
      popular: false,
    },
    {
      name: 'أساسية',
      price: '11.85',
      description: 'مناسبة للأعمال الصغيرة',
      features: [
        '1000 طلب/شهريًا',
        'تصميم نموذج مخصص لكل منتج',
        'منشئ صفحات هبوط',
        '30 سلة مهجورة',
        'إدارة العملات',
        'Google Sheets',
        'حماية من الرسائل المزعجة',
        'بيكسلات وسائل التواصل المتعددة',
        'عروض كمية + تصميم مخصص',
        'ترقية المنتج + تصميم مخصص',
        'أسعار الشحن',
        'دعم 24/7',
      ],
      popular: false,
    },
    {
      name: 'مميزة',
      price: '22.85',
      description: 'الأفضل للنمو',
      features: [
        'طلبات غير محدودة/شهريًا',
        'تصميم نموذج مخصص لكل منتج',
        'منشئ صفحات هبوط',
        'سلات مهجورة غير محدودة',
        'إدارة العملات',
        'Google Sheets',
        'حماية من الرسائل المزعجة',
        'بيكسلات وسائل التواصل المتعددة',
        'عروض كمية + تصميم مخصص',
        'ترقية المنتج + تصميم مخصص',
        'أسعار الشحن',
        'دعم 24/7',
        'جميع الميزات الجديدة مشمولة',
      ],
      popular: true,
    },
  ] : [
    {
      name: 'Free',
      price: '0',
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
        '24x7 Support',
      ],
      popular: false,
    },
    {
      name: 'Basic',
      price: '11.85',
      description: 'Great for small businesses',
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
        '24x7 Support',
      ],
      popular: false,
    },
    {
      name: 'Premium',
      price: '22.85',
      description: 'Best for growing teams',
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
        'All new features included',
      ],
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-16 bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <div className={`text-center mb-12 ${isRTL ? 'rtl' : ''}`}>
          <h2 className="text-3xl font-bold mb-4">{t.heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t.sub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`flex flex-col ${plan.popular ? 'border-codform-purple ring-2 ring-codform-purple/20 shadow-lg' : 'border-gray-200'}`}
            >
              {plan.popular && (
                <div className="bg-codform-purple text-white text-center py-1 text-sm font-medium">
                  {t.mostPopular}
                </div>
              )}
              <CardHeader className={`pb-0 ${isRTL ? 'text-right' : 'text-left'} text-center md:text-inherit`}>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500"> {t.perMonth}</span>
                </div>
                <p className="text-gray-500">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3 mt-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className={`flex items-center ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                      <Check className={`h-5 w-5 text-codform-purple flex-shrink-0 ${isRTL ? 'ml-0 mr-3' : 'ml-3'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full ${plan.popular ? 'bg-codform-purple hover:bg-codform-dark-purple' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {t.selectPlan}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
