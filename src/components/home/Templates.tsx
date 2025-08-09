
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const Templates = () => {
  const templates = [
    {
      id: 1,
      title: "نموذج منتج واحد",
      description: "تركيز كامل على منتج واحد مع خطوات بسيطة",
      steps: 2,
      fields: 8,
      accent: "from-primary to-secondary",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      title: "نموذج متعدد المنتجات",
      description: "اختيار عدة منتجات مع خيارات وعروض كمية",
      steps: 3,
      fields: 14,
      accent: "from-secondary to-primary",
      image: "/placeholder.svg"
    },
    {
      id: 3,
      title: "نموذج متجر شامل",
      description: "نموذج شامل للمتجر مع أقسام مخصصة",
      steps: 4,
      fields: 16,
      accent: "from-codform-purple to-codform-dark-purple",
      image: "/placeholder.svg"
    }
  ];

  return (
    <section id="templates" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">قوالب جاهزة</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            مجموعة من القوالب الجاهزة للاستخدام الفوري لتوفير وقتك وجهدك
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-3 bg-gradient-to-r ${template.accent}`}></div>
              <CardContent className="p-6">
                <AspectRatio ratio={16 / 9}>
                  <img
                    src={template.image}
                    alt={`معاينة ${template.title}`}
                    className="h-full w-full object-cover rounded-md border border-muted"
                    loading="lazy"
                  />
                </AspectRatio>
                <div className="text-right mt-6">
                  <h3 className="text-xl font-semibold mb-2">{template.title}</h3>
                  <p className="text-gray-600">{template.description}</p>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-4">
                  <div>{template.fields} حقول</div>
                  <div>{template.steps} خطوات</div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 p-4">
                <Button variant="outline" className="w-full">استخدام القالب</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-10">
          <Button>استعراض جميع القوالب</Button>
        </div>
      </div>
    </section>
  );
};

export default Templates;
