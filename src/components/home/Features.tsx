
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const Features = () => {
  const features = [
    {
      title: 'نماذج قابلة للتخصيص',
      description: 'إنشاء نماذج مخصصة مع حقول متنوعة حسب احتياجاتك'
    },
    {
      title: 'قوالب جاهزة',
      description: 'مجموعة من القوالب الجاهزة للاستخدام الفوري'
    },
    {
      title: 'الحفظ التلقائي',
      description: 'حفظ بيانات النموذج تلقائيًا أثناء التعبئة'
    },
    {
      title: 'نماذج متعددة الخطوات',
      description: 'إنشاء نماذج متعددة الخطوات لتجربة أفضل للمستخدم'
    },
    {
      title: 'تكامل مع Shopify',
      description: 'تكامل سلس مع متاجر Shopify من خلال امتداد خاص'
    },
    {
      title: 'تتبع الطلبات',
      description: 'لوحة تحكم لتتبع الطلبات وإدارتها بكفاءة'
    },
    {
      title: 'دعم اللغات المتعددة',
      description: 'دعم اللغة العربية والإنجليزية والفرنسية'
    },
    {
      title: 'تحليلات متقدمة',
      description: 'تقارير وإحصائيات مفصلة حول أداء النماذج والمبيعات'
    }
  ];

  return (
    <section id="features" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">مميزات المنصة</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            مجموعة من المميزات المتقدمة التي تساعدك على إنشاء وإدارة نماذج الدفع عند الاستلام بكل سهولة
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white border border-gray-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-end">
                  <div className="bg-codform-light-purple p-2 rounded-full">
                    <Check className="h-5 w-5 text-codform-purple" />
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold text-right">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-right">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
