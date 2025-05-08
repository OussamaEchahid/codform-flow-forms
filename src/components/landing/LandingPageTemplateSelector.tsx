
import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft } from 'lucide-react';

// Define template categories
const categories = [
  { id: 'all', name: { en: 'All Categories', ar: 'كل الفئات' } },
  { id: 'sliders', name: { en: 'Sliders', ar: 'سلايدر' } },
  { id: 'banners', name: { en: 'Banners', ar: 'بانرات' } },
  { id: 'testimonial', name: { en: 'Testimonial', ar: 'شهادات العملاء' } },
  { id: 'cod_form', name: { en: 'COD Form', ar: 'نموذج الدفع عند الاستلام' } },
  { id: 'product_page', name: { en: 'Product Page', ar: 'صفحة منتج' } },
  { id: 'featured', name: { en: 'Featured', ar: 'مميزة' } },
  { id: 'call_to_action', name: { en: 'Call to Action', ar: 'حث على اتخاذ إجراء' } },
  { id: 'faqs', name: { en: 'FAQs', ar: 'أسئلة شائعة' } },
];

// Define template samples
const templates = [
  {
    id: 'products',
    category: 'product_page',
    name: { en: 'Products', ar: 'منتجات' },
    image: '/lovable-uploads/b6003e22-766a-43b5-b443-186b00d025ff.png',
    content: {
      sections: [
        {
          id: 'products-section',
          type: 'products',
          title: { en: 'Our Products', ar: 'منتجاتنا' },
          items: [
            { id: 'p1', name: 'Product 1', image: '/placeholder.svg' },
            { id: 'p2', name: 'Product 2', image: '/placeholder.svg' },
            { id: 'p3', name: 'Product 3', image: '/placeholder.svg' },
            { id: 'p4', name: 'Product 4', image: '/placeholder.svg' },
          ]
        }
      ]
    }
  },
  {
    id: 'cta-skin',
    category: 'call_to_action',
    name: { en: 'CTA Skin', ar: 'نداء للعناية بالبشرة' },
    image: '/lovable-uploads/863b0ec1-477b-44ad-a84a-56b054f3b3f7.png',
    content: {
      sections: [
        {
          id: 'cta-section',
          type: 'cta',
          title: { en: 'Want to revolutionize your skin care routine?', ar: 'تريدين ثورة في روتين العناية ببشرتك؟' },
          image: '/lovable-uploads/863b0ec1-477b-44ad-a84a-56b054f3b3f7.png',
          buttonText: { en: 'Learn More', ar: 'اعرف المزيد' },
          buttonUrl: '#'
        }
      ]
    }
  },
  {
    id: 'faq',
    category: 'faqs',
    name: { en: 'F.A.Q', ar: 'أسئلة شائعة' },
    image: '/lovable-uploads/1f177611-73d6-44ca-9932-d4245e19f258.png',
    content: {
      sections: [
        {
          id: 'faq-section',
          type: 'faq',
          title: { en: 'Frequently Asked Questions', ar: 'الأسئلة الأكثر شيوعًا' },
          subtitle: { 
            en: 'Here are some common questions about our products. If you cannot find what you are looking for, please contact us!',
            ar: 'هنا تجد الأسئلة الأكثر شيوعًا حول منتجاتنا. إذا لم تجد ما تبحث عنه، يمكنك دائمًا الاتصال بنا عبر قنوات التواصل!' 
          },
          items: [
            { 
              id: 'q1', 
              question: { en: 'When will my order ship?', ar: 'متى سيُشحن طلبي؟' },
              answer: { en: 'Orders typically ship within 24-48 hours.', ar: 'عادةً ما يتم شحن الطلبات خلال 24-48 ساعة.' }
            },
            { 
              id: 'q2', 
              question: { en: 'How long does shipping take?', ar: 'كم تستغرق عملية الشحن من الوقت؟' },
              answer: { en: 'Shipping takes 3-5 business days depending on your location.', ar: 'تستغرق عملية الشحن 3-5 أيام عمل حسب موقعك.' }
            },
            { 
              id: 'q3', 
              question: { en: 'How can I cancel an order?', ar: 'كيف يمكنني إلغاء طلب؟' },
              answer: { en: 'Contact our support team to cancel your order.', ar: 'اتصل بفريق الدعم لدينا لإلغاء طلبك.' }
            },
            { 
              id: 'q4', 
              question: { en: 'What is the return policy?', ar: 'ماهي سياسة الإرجاع؟' },
              answer: { en: 'We accept returns within 30 days of delivery.', ar: 'نقبل المرتجعات خلال 30 يومًا من التسليم.' }
            },
            { 
              id: 'q5', 
              question: { en: 'What are the payment methods?', ar: 'ما هي طرق الدفع التي تقبلونها؟' },
              answer: { en: 'We accept credit cards, PayPal, and cash on delivery.', ar: 'نقبل بطاقات الائتمان وباي بال والدفع عند الاستلام.' }
            },
          ]
        }
      ]
    }
  },
  {
    id: 'cod-form',
    category: 'cod_form',
    name: { en: 'COD Form', ar: 'نموذج الدفع عند الإستلام' },
    image: '/lovable-uploads/7c19d111-255a-4e1e-b888-5d831fb4ba4f.png',
    content: {
      sections: [
        {
          id: 'cod-form-section',
          type: 'cod_form',
          formId: '',
          title: { en: 'Order Now', ar: 'اطلب الآن' },
          subtitle: { en: 'Fill the form below to place your order', ar: 'املأ النموذج أدناه لتقديم طلبك' },
          image: '/lovable-uploads/7c19d111-255a-4e1e-b888-5d831fb4ba4f.png'
        }
      ]
    }
  },
  {
    id: 'cod-form-variant',
    category: 'cod_form',
    name: { en: 'COD Form - variant', ar: 'نموذج الدفع - نسخة أخرى' },
    image: '/lovable-uploads/7c19d111-255a-4e1e-b888-5d831fb4ba4f.png',
    content: {
      sections: [
        {
          id: 'cod-form-variant-section',
          type: 'cod_form_variant',
          formId: '',
          title: { en: 'Order Form', ar: 'نموذج الطلب' },
          subtitle: { en: 'Fill out this form to place your order', ar: 'املأ هذا النموذج لتقديم طلبك' },
          image: '/lovable-uploads/7c19d111-255a-4e1e-b888-5d831fb4ba4f.png'
        }
      ]
    }
  },
  {
    id: 'responsive-image',
    category: 'banners',
    name: { en: 'Responsive Image', ar: 'صورة متجاوبة' },
    image: '/placeholder.svg',
    content: {
      sections: [
        {
          id: 'responsive-image-section',
          type: 'responsive_image',
          desktopImage: '/placeholder.svg',
          tabletImage: '/placeholder.svg',
          mobileImage: '/placeholder.svg',
          alt: { en: 'Responsive image', ar: 'صورة متجاوبة' },
          link: ''
        }
      ]
    }
  },
  {
    id: 'video',
    category: 'featured',
    name: { en: 'Video', ar: 'فيديو' },
    image: '/placeholder.svg',
    content: {
      sections: [
        {
          id: 'video-section',
          type: 'video',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          title: { en: 'Watch our product video', ar: 'شاهد فيديو المنتج' },
          poster: '/placeholder.svg'
        }
      ]
    }
  },
  {
    id: 'hero',
    category: 'banners',
    name: { en: 'Hero', ar: 'بانر رئيسي' },
    image: '/placeholder.svg',
    content: {
      sections: [
        {
          id: 'hero-section',
          type: 'hero',
          title: { en: 'Main Headline Goes Here', ar: 'العنوان الرئيسي يوضع هنا' },
          subtitle: { en: 'Supporting text goes here', ar: 'النص الداعم يوضع هنا' },
          image: '/placeholder.svg',
          buttonText: { en: 'Call to action', ar: 'اضغط هنا' },
          buttonUrl: '#'
        }
      ]
    }
  }
];

interface LandingPageTemplateSelectorProps {
  onSelect: (template: any) => void;
  onBack: () => void;
}

const LandingPageTemplateSelector: React.FC<LandingPageTemplateSelectorProps> = ({ 
  onSelect,
  onBack
}) => {
  const { t, language } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('sections');

  const handleSelectTemplate = (template: any) => {
    onSelect(template.content);
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={onBack} className="mr-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {language === 'ar' ? 'العودة' : 'Back'}
          </Button>
          <h1 className="text-2xl font-semibold">
            {language === 'ar' ? 'اختر قالبًا لصفحتك' : 'Choose a template for your page'}
          </h1>
        </div>

        <div className="mb-6">
          <Tabs defaultValue="sections" onValueChange={setActiveTab}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="sections" className="flex-1">
                {language === 'ar' ? 'القوالب الجاهزة' : 'Ready Templates'}
              </TabsTrigger>
              <TabsTrigger value="full_page" className="flex-1">
                {language === 'ar' ? 'صفحة كاملة' : 'Full Page'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sections" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {categories.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className="text-center justify-center"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {language === 'ar' ? category.name.ar : category.name.en}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredTemplates.map(template => (
                  <Card
                    key={template.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                      <img
                        src={template.image}
                        alt={language === 'ar' ? template.name.ar : template.name.en}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-lg">
                        {language === 'ar' ? template.name.ar : template.name.en}
                      </h3>
                      <div className="mt-2 flex justify-between">
                        <span className="text-sm text-gray-500">
                          {language === 'ar' ? categories.find(cat => cat.id === template.category)?.name.ar : categories.find(cat => cat.id === template.category)?.name.en}
                        </span>
                        <Button size="sm">
                          {language === 'ar' ? 'إضافة' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="full_page">
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">
                  {language === 'ar' 
                    ? 'قريباً! سيتم إضافة قوالب الصفحات الكاملة قريباً.' 
                    : 'Coming soon! Full page templates will be available soon.'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LandingPageTemplateSelector;
