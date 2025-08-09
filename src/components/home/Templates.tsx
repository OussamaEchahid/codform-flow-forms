
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TemplatePreview: React.FC<{ accentCls: string; title: string }> = ({ accentCls, title }) => {
  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${accentCls}`}></div>
      <div className="p-4" dir="rtl">
        <div className="text-center mb-4">
          <h4 className="text-base font-bold text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground">الرجاء تعبئة البيانات لإتمام الطلب</p>
        </div>
        <form className="space-y-3">
          <div>
            <label className="block text-sm text-foreground mb-1">الاسم الكامل<span className="text-destructive mr-1">*</span></label>
            <input className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="أدخل الاسم" />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-1">رقم الهاتف<span className="text-destructive mr-1">*</span></label>
            <input className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="مثال: +966 5xxxxxxxx" />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-1">العنوان</label>
            <textarea rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="أدخل العنوان الكامل"></textarea>
          </div>
          <button type="button" className="w-full h-10 rounded-md text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">إرسال الطلب</button>
        </form>
      </div>
    </div>
  );
};

const Templates = () => {
  const templates = [
    {
      id: 1,
      title: "نموذج منتج واحد",
      description: "تركيز كامل على منتج واحد بخطوات بسيطة",
      accent: "from-primary to-secondary",
    },
    {
      id: 2,
      title: "نموذج متعدد المنتجات",
      description: "اختيار عدة منتجات مع حقول أساسية",
      accent: "from-codform-purple to-codform-dark-purple",
    },
    {
      id: 3,
      title: "نموذج متجر شامل",
      description: "نموذج شامل للمتجر مع حقول رئيسية",
      accent: "from-secondary to-primary",
    }
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
