
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const Features = () => {
  const features = [
    {
      title: "إدارة الطلبات المتروكة",
      description: "استرجاع المبيعات عبر تتبع العملاء وإشعارات ذكية"
    },
    {
      title: "نموذج لكل منتج",
      description: "إنشاء نماذج مخصصة لكل منتج بسهولة"
    },
    {
      title: "عروض الكمية الذكية",
      description: "رفع متوسط قيمة الطلب بخصومات كمية مرنة"
    },
    {
      title: "إدارة العملات",
      description: "تعيين عملة لكل نموذج أو منتج وتحديث أسعار تلقائي"
    },
    {
      title: "مكافحة السبام",
      description: "حماية مدمجة مع فلاتر ذكية وقيود تلقائية"
    },
    {
      title: "تتبع إعلاني",
      description: "قياس الأداء وربط الأحداث مع منصات الإعلانات"
    },
    {
      title: "إنشاء بنقرة واحدة",
      description: "توليد نماذج جاهزة باللغة التي تريد"
    },
    {
      title: "صفحات الهبوط",
      description: "قوالب هبوط محسّنة للتحويل",
      soon: true as const
    },
    {
      title: "تكامل Shopify",
      description: "تكامل سلس مع المتجر وإدارة المنتجات"
    },
    {
      title: "تحليلات وتقارير",
      description: "لوحة مؤشرات لتتبع الأداء والمبيعات"
    },
    {
      title: "دعم متعدد اللغات",
      description: "تعريب كامل ودعم اتجاه RTL للغة العربية"
    },
    {
      title: "معاينة فورية للنموذج",
      description: "رؤية شكل النموذج أثناء البناء دون مغادرة الصفحة"
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
                <div className="flex justify-end items-center gap-2">
                  <div className="bg-codform-light-purple p-2 rounded-full">
                    <Check className="h-5 w-5 text-codform-purple" />
                  </div>
                  {('soon' in feature) && (feature as any).soon && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground/70 rtl:ml-0 rtl:mr-2">قريباً</span>
                  )}
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
