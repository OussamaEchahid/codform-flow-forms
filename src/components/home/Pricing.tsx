
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: "مجاني",
      price: "0",
      description: "ابدأ بالتجربة للمتاجر الناشئة",
      features: [
        "نموذج واحد",
        "حتى 100 استجابة شهريًا",
        "عروض كمية أساسية",
        "إدارة عملة واحدة",
        "حماية سبام أساسية"
      ],
      button: "ابدأ مجانًا",
      popular: false
    },
    {
      name: "أساسي",
      price: "19",
      description: "للمتاجر النامية",
      features: [
        "حتى 10 نماذج",
        "حتى 3,000 استجابة شهريًا",
        "عروض كمية متقدمة",
        "إدارة عملات لكل نموذج",
        "تكامل Shopify + تتبع الطلبات المتروكة",
        "تتبع إعلاني أساسي"
      ],
      button: "اشترك الآن",
      popular: false
    },
    {
      name: "احترافي",
      price: "39",
      description: "للمتاجر المتقدمة",
      features: [
        "نماذج واستجابات غير محدودة",
        "صفحات هبوط",
        "تتبع إعلاني متقدم",
        "إنشاء نماذج بنقرة واحدة",
        "تحليلات وتقارير متقدمة",
        "أولوية الدعم الفني"
      ],
      button: "اشترك الآن",
      popular: true
    }
  ];

  return (
    <section id="pricing" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">خطط الأسعار</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            اختر الخطة المناسبة لاحتياجاتك مع إمكانية الترقية في أي وقت
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`flex flex-col ${
                plan.popular 
                  ? 'border-codform-purple ring-2 ring-codform-purple/20 shadow-lg' 
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="bg-codform-purple text-white text-center py-1 text-sm font-medium">
                  الأكثر شيوعًا
                </div>
              )}
              <CardHeader className="text-center pb-0">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500"> $ / شهريًا</span>
                </div>
                <p className="text-gray-500">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3 mt-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex rtl:flex-row-reverse items-center text-right">
                      <Check className="h-5 w-5 text-codform-purple flex-shrink-0 ml-3 rtl:ml-0 rtl:mr-3" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-codform-purple hover:bg-codform-dark-purple' 
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.button}
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
