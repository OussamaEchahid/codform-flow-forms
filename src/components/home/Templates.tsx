
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const TemplatePreview: React.FC<{ accentCls: string; title: string }> = ({ accentCls, title }) => {
  const { language, isRTL } = useI18n();
  const t = {
    title: language === 'ar' ? 'الرجاء تعبئة البيانات لإتمام الطلب' : 'Please fill your details to complete the order',
    name: language === 'ar' ? 'الاسم الكامل' : 'Full name',
    phone: language === 'ar' ? 'رقم الهاتف' : 'Phone number',
    address: language === 'ar' ? 'العنوان' : 'Address',
    namePh: language === 'ar' ? 'أدخل الاسم' : 'Enter your name',
    phonePh: language === 'ar' ? 'مثال: +966 5xxxxxxxx' : 'e.g. +1 555 123 4567',
    addressPh: language === 'ar' ? 'أدخل العنوان الكامل' : 'Enter full address',
    submit: language === 'ar' ? 'إرسال الطلب' : 'Submit order',
  };
  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${accentCls}`}></div>
      <div className="p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center mb-4">
          <h4 className="text-base font-bold text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground">{t.title}</p>
        </div>
        <form className="space-y-3">
          <div>
            <label className={`block text-sm text-foreground mb-1 ${isRTL ? '' : ''}`}>{t.name}<span className={`text-destructive ${isRTL ? 'mr-1' : 'ml-1'}`}>*</span></label>
            <input className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder={t.namePh} />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-1">{t.phone}<span className={`text-destructive ${isRTL ? 'mr-1' : 'ml-1'}`}>*</span></label>
            <input className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder={t.phonePh} />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-1">{t.address}</label>
            <textarea rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder={t.addressPh}></textarea>
          </div>
          <button type="button" className="w-full h-10 rounded-md text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">{t.submit}</button>
        </form>
      </div>
    </div>
  );
};

const Templates = () => {
  const { language, isRTL } = useI18n();
  const templates = language === 'ar'
    ? [
        { id: 1, title: 'نموذج منتج واحد', description: 'تركيز كامل على منتج واحد بخطوات بسيطة', accent: 'from-primary to-secondary' },
        { id: 2, title: 'نموذج متعدد المنتجات', description: 'اختيار عدة منتجات مع حقول أساسية', accent: 'from-codform-purple to-codform-dark-purple' },
        { id: 3, title: 'نموذج متجر شامل', description: 'نموذج شامل للمتجر مع حقول رئيسية', accent: 'from-secondary to-primary' },
      ]
    : [
        { id: 1, title: 'Single product form', description: 'Fully focused on one product with simple steps', accent: 'from-primary to-secondary' },
        { id: 2, title: 'Multi‑product form', description: 'Choose multiple products with essential fields', accent: 'from-codform-purple to-codform-dark-purple' },
        { id: 3, title: 'Store‑wide form', description: 'Comprehensive store form with main fields', accent: 'from-secondary to-primary' },
      ];

  return (
    <section id="templates" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">قوالب جاهزة</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ثلاثة قوالب احترافية تعرض المعاينة مباشرة — بدون ملخص سلة أو عروض كمية
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <TemplatePreview accentCls={template.accent} title={template.title} />
                <div className="text-right mt-6">
                  <h3 className="text-xl font-semibold mb-2">{template.title}</h3>
                  <p className="text-gray-600">{template.description}</p>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 p-4">
                <Button variant="outline" className="w-full">استخدام القالب</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Templates;
