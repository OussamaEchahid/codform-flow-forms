
import React, { useState } from 'react';
import { Plus, Trash, ChevronDown, ChevronUp, Move } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LandingPageSectionsProps {
  content: any;
  selectedSection: string | null;
  onSelectSection: (sectionId: string | null) => void;
  onUpdateSection: (sectionId: string, sectionData: any) => void;
  onAddSection: (sectionTemplate: any) => void;
  onRemoveSection: (sectionId: string) => void;
}

interface SectionTemplate {
  id: string;
  name: { en: string; ar: string };
  type: string;
  icon: string;
  defaultContent: any;
}

const sectionTemplates: SectionTemplate[] = [
  {
    id: 'hero',
    name: { en: 'Hero Banner', ar: 'بانر رئيسي' },
    type: 'hero',
    icon: '🏆',
    defaultContent: {
      id: `hero-${Date.now()}`,
      type: 'hero',
      title: { en: 'Main Headline', ar: 'العنوان الرئيسي' },
      subtitle: { en: 'Supporting text goes here', ar: 'النص الداعم يأتي هنا' },
      image: '/placeholder.svg',
      buttonText: { en: 'Shop Now', ar: 'تسوق الآن' },
      buttonUrl: '#'
    }
  },
  {
    id: 'products',
    name: { en: 'Products Showcase', ar: 'عرض المنتجات' },
    type: 'products',
    icon: '🛍️',
    defaultContent: {
      id: `products-${Date.now()}`,
      type: 'products',
      title: { en: 'Our Products', ar: 'منتجاتنا' },
      items: [
        { id: 'p1', name: 'Product 1', price: '100', image: '/placeholder.svg' },
        { id: 'p2', name: 'Product 2', price: '200', image: '/placeholder.svg' },
        { id: 'p3', name: 'Product 3', price: '300', image: '/placeholder.svg' }
      ]
    }
  },
  {
    id: 'faq',
    name: { en: 'FAQ', ar: 'الأسئلة الشائعة' },
    type: 'faq',
    icon: '❓',
    defaultContent: {
      id: `faq-${Date.now()}`,
      type: 'faq',
      title: { en: 'Frequently Asked Questions', ar: 'الأسئلة المتداولة' },
      subtitle: { en: 'Find answers to common questions', ar: 'اعثر على إجابات للأسئلة الشائعة' },
      items: [
        { 
          id: 'q1', 
          question: { en: 'How do I place an order?', ar: 'كيف يمكنني تقديم طلب؟' },
          answer: { en: 'You can place an order through our website or by calling our customer service.', ar: 'يمكنك تقديم طلب من خلال موقعنا أو عن طريق الاتصال بخدمة العملاء.' }
        },
        { 
          id: 'q2', 
          question: { en: 'What payment methods do you accept?', ar: 'ما هي طرق الدفع المقبولة؟' },
          answer: { en: 'We accept credit cards, PayPal, and cash on delivery.', ar: 'نقبل بطاقات الائتمان، باي بال، والدفع عند الاستلام.' }
        }
      ]
    }
  },
  {
    id: 'cod_form',
    name: { en: 'Order Form', ar: 'نموذج الطلب' },
    type: 'cod_form',
    icon: '📝',
    defaultContent: {
      id: `cod-form-${Date.now()}`,
      type: 'cod_form',
      formId: '',
      title: { en: 'Order Now', ar: 'اطلب الآن' },
      subtitle: { en: 'Fill the form below to place your order', ar: 'املأ النموذج أدناه لتقديم طلبك' },
      image: '/placeholder.svg'
    }
  },
  {
    id: 'image',
    name: { en: 'Image', ar: 'صورة' },
    type: 'image',
    icon: '🖼️',
    defaultContent: {
      id: `image-${Date.now()}`,
      type: 'image',
      image: '/placeholder.svg',
      alt: { en: 'Image description', ar: 'وصف الصورة' },
      link: ''
    }
  },
  {
    id: 'testimonial',
    name: { en: 'Testimonials', ar: 'شهادات العملاء' },
    type: 'testimonial',
    icon: '⭐',
    defaultContent: {
      id: `testimonial-${Date.now()}`,
      type: 'testimonial',
      title: { en: 'What Our Customers Say', ar: 'ماذا يقول عملاؤنا' },
      items: [
        { 
          id: 't1', 
          name: 'John Doe', 
          text: { en: 'Great product! Highly recommended!', ar: 'منتج رائع! أوصي به بشدة!' },
          rating: 5,
          image: '/placeholder.svg'
        },
        { 
          id: 't2', 
          name: 'Jane Smith', 
          text: { en: 'Excellent customer service!', ar: 'خدمة عملاء ممتازة!' },
          rating: 5,
          image: '/placeholder.svg'
        }
      ]
    }
  },
  {
    id: 'video',
    name: { en: 'Video', ar: 'فيديو' },
    type: 'video',
    icon: '🎬',
    defaultContent: {
      id: `video-${Date.now()}`,
      type: 'video',
      videoUrl: '',
      title: { en: 'Watch our Product Video', ar: 'شاهد فيديو المنتج' },
      poster: '/placeholder.svg'
    }
  }
];

const LandingPageSections: React.FC<LandingPageSectionsProps> = ({
  content,
  selectedSection,
  onSelectSection,
  onUpdateSection,
  onAddSection,
  onRemoveSection
}) => {
  const { language } = useI18n();
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState<boolean>(false);

  const handleAddNewSection = (template: SectionTemplate) => {
    const newSectionId = `${template.type}-${Date.now()}`;
    const newSectionContent = {
      ...template.defaultContent,
      id: newSectionId
    };
    
    onAddSection(newSectionContent);
    setIsAddSectionDialogOpen(false);
    
    // Select the new section after adding
    setTimeout(() => {
      onSelectSection(newSectionId);
    }, 100);
  };

  // Get a readable name for a section based on its type
  const getSectionName = (section: any) => {
    const template = sectionTemplates.find(t => t.type === section.type);
    return template ? (language === 'ar' ? template.name.ar : template.name.en) : section.type;
  };

  // Get an icon for a section based on its type
  const getSectionIcon = (section: any) => {
    const template = sectionTemplates.find(t => t.type === section.type);
    return template ? template.icon : '📄';
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">
          {language === 'ar' ? 'أقسام الصفحة' : 'Page Sections'}
        </h2>
        <Button size="sm" onClick={() => setIsAddSectionDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {language === 'ar' ? 'إضافة قسم' : 'Add Section'}
        </Button>
      </div>

      {content && content.sections && content.sections.length > 0 ? (
        <Accordion type="single" collapsible className="border rounded-md">
          {content.sections.map((section: any, index: number) => (
            <AccordionItem key={section.id} value={section.id}>
              <div 
                className={`flex items-center p-2 cursor-pointer ${selectedSection === section.id ? 'bg-gray-100' : ''}`}
                onClick={() => onSelectSection(section.id)}
              >
                <div className="mr-2">{getSectionIcon(section)}</div>
                <AccordionTrigger className="flex-1 hover:no-underline">
                  <div className="text-sm font-medium">
                    {getSectionName(section)}
                  </div>
                </AccordionTrigger>
              </div>
              <AccordionContent>
                <div className="p-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID: {section.id}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500"
                      onClick={() => onRemoveSection(section.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    {index > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-6 w-6 p-0"
                        title={language === 'ar' ? 'تحريك لأعلى' : 'Move up'}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < content.sections.length - 1 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-6 w-6 p-0"
                        title={language === 'ar' ? 'تحريك لأسفل' : 'Move down'}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">
            {language === 'ar' 
              ? 'لا توجد أقسام بعد. أضف قسمًا للبدء.' 
              : 'No sections yet. Add a section to get started.'}
          </p>
          <Button onClick={() => setIsAddSectionDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {language === 'ar' ? 'إضافة قسم' : 'Add Section'}
          </Button>
        </div>
      )}

      {/* Add Section Dialog */}
      <Dialog open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إضافة قسم جديد' : 'Add a New Section'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {sectionTemplates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => handleAddNewSection(template)}
              >
                <div className="text-2xl">{template.icon}</div>
                <span className="text-xs font-medium">
                  {language === 'ar' ? template.name.ar : template.name.en}
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPageSections;
