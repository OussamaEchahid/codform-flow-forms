
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "0",
      description: "Perfect for getting started",
      features: [
        "70 Orders/mo",
        "Custom form design for each product",
        "Landing page builder",
        "30 Abandoned checkouts",
        "Currency Management",
        "Google Sheets",
        "Spam Protection",
        "Multi Social media Pixels",
        "Quantity offers + Customized design",
        "Upsell + Customized design",
        "Shipping Rates",
        "24x7 Support"
      ],
      button: "الخطة الحالية",
      popular: false
    },
    {
      name: "Basic",
      price: "11.85",
      description: "Great for small businesses",
      features: [
        "1000 Orders/mo",
        "Custom form design for each product",
        "Landing page builder",
        "30 Abandoned checkouts",
        "Currency Management",
        "Google Sheets",
        "Spam Protection",
        "Multi Social media Pixels",
        "Quantity offers + Customized design",
        "Upsell + Customized design",
        "Shipping Rates",
        "24x7 Support"
      ],
      button: "ترقية للأساسية",
      popular: false
    },
    {
      name: "Premium",
      price: "22.85",
      description: "Best for growing teams",
      features: [
        "Unlimited Orders/mo",
        "Custom form design for each product",
        "Landing page builder",
        "Unlimited Abandoned orders",
        "Currency Management",
        "Google Sheets",
        "Spam Protection",
        "Multi Social media Pixels",
        "Quantity offers + Customized design",
        "Upsell + Customized design",
        "Shipping Rates",
        "24x7 Support",
        "All new features included"
      ],
      button: "ترقية للمتقدمة",
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
