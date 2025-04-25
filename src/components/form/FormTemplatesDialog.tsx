
import React, { useState, useEffect } from 'react';
import { 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formTemplates } from '@/lib/form-utils';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { User, Phone, MapPin, Mail, Package2, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface FormTemplatesDialogProps {
  onSelect: (templateId: number) => void;
  onClose: () => void;
}

const FormTemplatesDialog: React.FC<FormTemplatesDialogProps> = ({ 
  onSelect,
  onClose
}) => {
  const { language } = useI18n();
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  
  const templateImages = [
    // Template 1 - Brown theme
    <div key="template-1" className="border rounded-lg overflow-hidden bg-white">
      <div className="p-3 bg-gray-50 border-b font-medium text-center">
        {language === 'ar' ? 'تفاصيل التوصيل' : 'DELIVERY DETAILS'}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 border rounded flex items-center justify-center mr-2">
              <Package2 size={20} />
            </div>
            <div>
              <div className="font-medium">{language === 'ar' ? 'عنوان المنتج' : 'Product title'}</div>
              <div className="text-xs text-gray-500">{language === 'ar' ? 'معلومات المتغير' : 'Variant info'}</div>
            </div>
          </div>
          <div className="flex items-center">
            <button className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center">
              <Minus size={14} />
            </button>
            <span className="mx-2">1</span>
            <button className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center">
              <Plus size={14} />
            </button>
            <span className="ml-3 font-medium">0.00 dh</span>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          <div>
            <label className="block mb-1 text-sm font-medium">
              {language === 'ar' ? 'الاسم الكامل' : 'Full name'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <User size={16} />
              </div>
              <input className="w-full pl-9 pr-3 py-2 border rounded" disabled placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full name'} />
            </div>
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium">
              {language === 'ar' ? 'رقم الهاتف' : 'Phone number'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Phone size={16} />
              </div>
              <input className="w-full pl-9 pr-3 py-2 border rounded" disabled placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone number'} />
            </div>
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium">
              {language === 'ar' ? 'المدينة' : 'City'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <MapPin size={16} />
              </div>
              <input className="w-full pl-9 pr-3 py-2 border rounded" disabled placeholder={language === 'ar' ? 'المدينة' : 'City'} />
            </div>
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium">
              {language === 'ar' ? 'العنوان' : 'Address'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <MapPin size={16} />
              </div>
              <textarea className="w-full pl-9 pr-3 py-2 border rounded h-20" disabled placeholder={language === 'ar' ? 'العنوان' : 'Address'} />
            </div>
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Mail size={16} />
              </div>
              <input className="w-full pl-9 pr-3 py-2 border rounded" disabled placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'} />
            </div>
          </div>
        </div>
        
        <div className="border-t pt-3 mb-3">
          <div className="flex justify-between py-1">
            <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span>0.00 dh</span>
          </div>
          <div className="flex justify-between py-1">
            <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
            <span>0.00 dh</span>
          </div>
          <div className="flex justify-between py-1">
            <span>{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
            <span>0.00 dh</span>
          </div>
          <div className="flex justify-between py-1 font-bold">
            <span>{language === 'ar' ? 'المجموع' : 'Total'}</span>
            <span>0.00 dh</span>
          </div>
        </div>
        
        <button className="w-full bg-amber-600 text-white p-3 rounded font-medium flex items-center justify-center">
          {language === 'ar' ? 'تقديم الطلب (الدفع عند الاستلام)' : 'Place the order (Payment on delivery)'}
        </button>
      </div>
    </div>,
    
    // Template 2 - Blue theme
    <div key="template-2" className="border rounded-lg overflow-hidden bg-white">
      <div className="p-4 bg-blue-500 text-white text-center">
        {language === 'ar' ? 'الرجاء إدخال معلوماتك للطلب' : 'To order, please enter your information here'}
      </div>
      <div className="p-4">
        <div className="space-y-3 mb-4">
          <div className="relative">
            <div className="absolute left-3 top-2.5 text-blue-400">
              <User size={16} />
            </div>
            <input className="w-full pl-9 pr-3 py-2 border rounded" disabled placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full name'} />
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-2.5 text-blue-400">
              <Phone size={16} />
            </div>
            <input className="w-full pl-9 pr-3 py-2 border rounded" disabled placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone number'} />
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-2.5 text-blue-400">
              <MapPin size={16} />
            </div>
            <input className="w-full pl-9 pr-3 py-2 border rounded" disabled placeholder={language === 'ar' ? 'المدينة' : 'City'} />
          </div>
          
          <div className="relative">
            <textarea className="w-full pl-3 pr-3 py-2 border rounded h-20" disabled placeholder={language === 'ar' ? 'العنوان' : 'Address'} />
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between border rounded p-2">
            <div>
              <input type="radio" id="free-delivery" name="delivery" disabled />
              <label htmlFor="free-delivery" className="ml-2">{language === 'ar' ? 'التوصيل المجاني' : 'Free delivery'}</label>
            </div>
            <span>0.00 dh</span>
          </div>
          <div className="flex items-center justify-between border rounded p-2">
            <div>
              <input type="radio" id="fast-delivery" name="delivery" disabled />
              <label htmlFor="fast-delivery" className="ml-2">{language === 'ar' ? 'التوصيل السريع' : 'Fast delivery'}</label>
            </div>
            <span>20.00 dh</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 border rounded flex items-center justify-center mr-2">
              <Package2 size={20} />
            </div>
            <div>
              <div className="font-medium">{language === 'ar' ? 'عنوان المنتج' : 'Product title'}</div>
              <div className="text-xs text-gray-500">{language === 'ar' ? 'معلومات المتغير' : 'Variant info'}</div>
            </div>
          </div>
          <div className="flex items-center">
            <button className="w-6 h-6 rounded-full bg-blue-400 text-white flex items-center justify-center">
              <Plus size={14} />
            </button>
            <span className="mx-2">1</span>
            <button className="w-6 h-6 rounded-full bg-blue-400 text-white flex items-center justify-center">
              <Minus size={14} />
            </button>
            <span className="ml-3 font-medium">0.00 dh</span>
          </div>
        </div>
        
        <div className="border-t pt-3 mb-3">
          <div className="flex justify-between py-1">
            <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span>0.00 dh</span>
          </div>
          <div className="flex justify-between py-1">
            <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
            <span>0.00 dh</span>
          </div>
          <div className="flex justify-between py-1">
            <span>{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
            <span>0.00 dh</span>
          </div>
          <div className="flex justify-between py-1 font-bold">
            <span>{language === 'ar' ? 'المجموع' : 'Total'}</span>
            <span>0.00 dh</span>
          </div>
        </div>
        
        <button className="w-full bg-blue-500 text-white p-3 rounded font-medium">
          {language === 'ar' ? 'تقديم الطلب (الدفع عند الاستلام)' : 'Place the order (Payment on delivery)'}
        </button>
      </div>
    </div>,
    
    // Template 3 - Green theme
    <div key="template-3" className="border rounded-lg overflow-hidden bg-white">
      <div className="p-4 bg-white border-b text-center">
        <div className="text-2xl font-bold tracking-widest text-teal-800 mb-2">LOGO</div>
        <div className="text-sm text-gray-600">
          {language === 'ar' ? 'لإتمام الطلب، يرجى ملء هذا النموذج. سنتصل بك لاحقًا' : 'To order, please complete this form. We will contact you later'}
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3 mb-4">
          <div className="relative">
            <div className="absolute left-3 top-2.5 text-teal-500">
              <User size={16} />
            </div>
            <input className="w-full pl-9 pr-3 py-2 border rounded-lg bg-blue-50" disabled placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full name'} />
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-2.5 text-teal-500">
              <Phone size={16} />
            </div>
            <input className="w-full pl-9 pr-3 py-2 border rounded-lg bg-blue-50" disabled placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone number'} />
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-2.5 text-teal-500">
              <MapPin size={16} />
            </div>
            <input className="w-full pl-9 pr-3 py-2 border rounded-lg bg-blue-50" disabled placeholder={language === 'ar' ? 'المدينة' : 'City'} />
          </div>
          
          <div className="relative">
            <textarea className="w-full pl-3 pr-3 py-2 border rounded-lg bg-blue-50 h-20" disabled placeholder={language === 'ar' ? 'العنوان' : 'Address'} />
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 border rounded flex items-center justify-center mr-2">
              <Package2 size={20} />
            </div>
            <div>
              <div className="font-medium">{language === 'ar' ? 'عنوان المنتج' : 'Product title'}</div>
              <div className="text-xs text-gray-500">{language === 'ar' ? 'معلومات المتغير' : 'Variant info'}</div>
            </div>
          </div>
          <div className="flex items-center">
            <button className="w-6 h-6 rounded-md bg-gray-200 text-gray-600 flex items-center justify-center">
              <Plus size={14} />
            </button>
            <span className="mx-2">1</span>
            <button className="w-6 h-6 rounded-md bg-gray-200 text-gray-600 flex items-center justify-center">
              <Minus size={14} />
            </button>
            <span className="ml-3 font-medium">0.00 dh</span>
          </div>
        </div>
        
        <div className="border-t pt-3 mb-3">
          <div className="flex justify-between py-1">
            <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span>0.00 dh</span>
          </div>
          <div className="flex justify-between py-1">
            <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
            <span>0.00 dh</span>
          </div>
          <div className="flex justify-between py-1">
            <span>{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
            <span>0.00 dh</span>
          </div>
          <div className="flex justify-between py-1 font-bold">
            <span>{language === 'ar' ? 'المجموع' : 'Total'}</span>
            <span>0.00 dh</span>
          </div>
        </div>
        
        <button className="w-full bg-teal-800 text-white p-3 rounded font-medium flex items-center justify-center">
          {language === 'ar' ? 'إكمال الطلب' : 'Complete the command'}
        </button>
      </div>
    </div>
  ];

  const handlePrevTemplate = () => {
    setCurrentTemplateIndex((prev) => 
      prev === 0 ? templateImages.length - 1 : prev - 1
    );
  };

  const handleNextTemplate = () => {
    setCurrentTemplateIndex((prev) => 
      prev === templateImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleSelectTemplate = () => {
    const currentTemplate = formTemplates[currentTemplateIndex] || formTemplates[0];
    if (currentTemplate) {
      toast.success(`تم اختيار قالب ${currentTemplate.title}`);
      onSelect(currentTemplate.id);
    }
  };

  const currentTemplate = formTemplates[currentTemplateIndex] || formTemplates[0];

  useEffect(() => {
    // Make sure current template index is valid
    if (currentTemplateIndex >= formTemplates.length) {
      setCurrentTemplateIndex(0);
    }
  }, [currentTemplateIndex]);

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader className="text-right">
        <DialogTitle>قوالب النماذج</DialogTitle>
        <DialogDescription>
          اختر أحد قوالب النماذج الجاهزة لبدء إنشاء نموذجك
        </DialogDescription>
      </DialogHeader>

      <div className="my-4">
        <div className="relative border-2 rounded-lg p-4">
          <div className="h-2 bg-gradient-to-r from-codform-purple to-codform-dark-purple absolute top-0 left-0 right-0 rounded-t-lg"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="text-right mb-4 col-span-1">
              <h3 className="font-semibold text-lg">{currentTemplate.title}</h3>
              <p className="text-sm text-gray-600">{currentTemplate.description}</p>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>{currentTemplate.fields} حقول</span>
                <span>{currentTemplate.steps} خطوات</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full mt-3" 
                onClick={handleSelectTemplate}
              >
                استخدام القالب
              </Button>
            </div>
            <div className="col-span-2 border rounded relative overflow-hidden">
              <div className="max-h-[400px] overflow-auto p-2">
                {templateImages[currentTemplateIndex]}
              </div>
            </div>
          </div>
          
          {/* Carousel navigation controls */}
          <div className="flex justify-center items-center gap-4 mt-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-white" 
              onClick={handlePrevTemplate}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              {templateImages.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2 h-2 rounded-full cursor-pointer ${currentTemplateIndex === index ? 'bg-codform-purple' : 'bg-gray-300'}`}
                  onClick={() => setCurrentTemplateIndex(index)}
                />
              ))}
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-white" 
              onClick={handleNextTemplate}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          إلغاء
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default FormTemplatesDialog;
