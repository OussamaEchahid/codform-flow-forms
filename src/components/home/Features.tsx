
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const Features = () => {
  const { language, isRTL } = useI18n();
  const features = language === 'ar'
    ? [
        { title: 'إدارة الطلبات المتروكة', description: 'استرجاع المبيعات عبر تتبع العملاء وإشعارات ذكية' },
        { title: 'نموذج لكل منتج', description: 'إنشاء نماذج مخصصة لكل منتج بسهولة' },
        { title: 'عروض الكمية الذكية', description: 'رفع متوسط قيمة الطلب بخصومات كمية مرنة' },
        { title: 'إدارة العملات', description: 'تعيين عملة لكل نموذج أو منتج وتحديث أسعار تلقائي' },
        { title: 'مكافحة السبام', description: 'حماية مدمجة مع فلاتر ذكية وقيود تلقائية' },
        { title: 'تتبع إعلاني', description: 'قياس الأداء وربط الأحداث مع منصات الإعلانات' },
        { title: 'إنشاء بنقرة واحدة', description: 'توليد نماذج جاهزة باللغة التي تريد' },
        { title: 'صفحات الهبوط', description: 'قوالب هبوط محسّنة للتحويل', soon: true as const },
        { title: 'تكامل Shopify', description: 'تكامل سلس مع المتجر وإدارة المنتجات' },
        { title: 'تحليلات وتقارير', description: 'لوحة مؤشرات لتتبع الأداء والمبيعات' },
        { title: 'دعم متعدد اللغات', description: 'تعريب كامل ودعم اتجاه RTL للغة العربية' },
        { title: 'معاينة فورية للنموذج', description: 'رؤية شكل النموذج أثناء البناء دون مغادرة الصفحة' },
      ]
    : [
        { title: 'Abandoned orders recovery', description: 'Recover sales via smart follow-ups and notifications' },
        { title: 'Per‑product form', description: 'Create a custom form for each product easily' },
        { title: 'Smart quantity offers', description: 'Boost AOV with flexible bulk discounts' },
        { title: 'Currency management', description: 'Set currency per form or product with auto updates' },
        { title: 'Spam protection', description: 'Built‑in protection with smart filters and limits' },
        { title: 'Ad tracking', description: 'Track performance and connect events to ad platforms' },
        { title: 'One‑click creation', description: 'Generate ready‑to‑use forms in your language' },
        { title: 'Landing pages', description: 'Conversion‑optimized landing templates', soon: true as const },
        { title: 'Shopify integration', description: 'Seamless store integration and product management' },
        { title: 'Analytics & reports', description: 'Dashboard to track performance and sales' },
        { title: 'Multi‑language support', description: 'Full localization and RTL support for Arabic' },
        { title: 'Live form preview', description: 'See your form while building without leaving the page' },
      ];

  return (
    <section id="features" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{language === 'ar' ? 'مميزات المنصة' : 'Platform features'}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {language === 'ar' ? 'مجموعة من المميزات المتقدمة التي تساعدك على إنشاء وإدارة نماذج الدفع عند الاستلام بكل سهولة' : 'Advanced features to build and manage cash-on-delivery forms easily.'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white border border-gray-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className={`flex items-center gap-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                  <div className="bg-codform-light-purple p-2 rounded-full">
                    <Check className="h-5 w-5 text-codform-purple" />
                  </div>
                  {('soon' in feature) && (feature as any).soon && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground/70 rtl:ml-0 rtl:mr-2">
                      {language === 'ar' ? 'قريباً' : 'Soon'}
                    </span>
                  )}
                </div>
                <CardTitle className={`text-xl font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
