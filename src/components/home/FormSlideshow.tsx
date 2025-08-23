import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// بيانات النماذج الأربع مع الصور
const formTemplates = [
  {
    id: 1,
    type: 'arabic-quantity',
    imageSrc: 'https://i.imgur.com/7uMpC6X.png',
    title: {
      ar: 'نموذج عربي مع عروض الكمية',
      en: 'Arabic Form with Quantity Offers'
    },
    description: {
      ar: 'نموذج دفع عند الاستلام باللغة العربية مع عروض الكمية الذكية',
      en: 'Arabic cash-on-delivery form with smart quantity offers'
    },
    theme: 'purple',
    features: {
      ar: ['عروض الكمية', 'واجهة عربية', 'تصميم متجاوب'],
      en: ['Quantity Offers', 'Arabic Interface', 'Responsive Design']
    }
  },
  {
    id: 2,
    type: 'blue-modern',
    imageSrc: 'https://i.imgur.com/ZD12sUC.png',
    title: {
      ar: 'نموذج أزرق عصري',
      en: 'Blue Modern Form'
    },
    description: {
      ar: 'تصميم عصري باللون الأزرق مع شارات الثقة',
      en: 'Modern blue design with trust badges'
    },
    theme: 'blue',
    features: {
      ar: ['شارات الثقة', 'تصميم عصري', 'ألوان جذابة'],
      en: ['Trust Badges', 'Modern Design', 'Attractive Colors']
    }
  },
  {
    id: 3,
    type: 'black-white-professional',
    imageSrc: 'https://i.imgur.com/VUPLrpu.png',
    title: {
      ar: 'نموذج احترافي أبيض وأسود',
      en: 'Black & White Professional Form'
    },
    description: {
      ar: 'تصميم احترافي بالأبيض والأسود مع زر واتساب',
      en: 'Professional black and white design with WhatsApp button'
    },
    theme: 'monochrome',
    features: {
      ar: ['زر واتساب', 'تصميم احترافي', 'سهولة الاستخدام'],
      en: ['WhatsApp Button', 'Professional Design', 'Easy to Use']
    }
  },
  {
    id: 4,
    type: 'purple-timer',
    imageSrc: 'https://i.imgur.com/axtzGlM.png',
    title: {
      ar: 'نموذج بنفسجي مع مؤقت',
      en: 'Purple Form with Timer'
    },
    description: {
      ar: 'نموذج بنفسجي مع مؤقت العرض المحدود',
      en: 'Purple form with limited time offer countdown'
    },
    theme: 'gradient',
    features: {
      ar: ['مؤقت العرض', 'ألوان جذابة', 'إحساس بالعجلة'],
      en: ['Countdown Timer', 'Attractive Colors', 'Urgency Feel']
    }
  }
];

// مكون عرض النموذج بالصورة
const FormPreview = ({ template }: { template: typeof formTemplates[0] }) => {
  const { language } = useI18n();

  return (
    <div className="flex-shrink-0 w-full flex justify-center">
      <div className="relative max-w-sm mx-auto">
        <img
          src={template.imageSrc}
          alt={template.title[language]}
          className="w-full h-auto rounded-3xl shadow-lg border-4 border-opacity-20"
          style={{
            borderColor: template.theme === 'purple' ? '#9b87f5' :
                        template.theme === 'blue' ? '#3b82f6' :
                        template.theme === 'monochrome' ? '#333' :
                        '#9b59b6'
          }}
        />
        {/* طبقة تفاعلية شفافة */}
        <div className="absolute inset-0 bg-transparent hover:bg-black hover:bg-opacity-5 transition-all duration-300 rounded-3xl cursor-pointer" />
      </div>
    </div>
  );
};



const FormSlideshow: React.FC = () => {
  const { language } = useI18n();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // التبديل التلقائي كل 4 ثوانٍ
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % formTemplates.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // إعادة تشغيل التبديل التلقائي بعد 10 ثوانٍ
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + formTemplates.length) % formTemplates.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % formTemplates.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const currentTemplate = formTemplates[currentSlide];

  // دالة لعرض النموذج المناسب
  const renderCurrentForm = () => {
    return <FormPreview template={currentTemplate} />;
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* الحاوية الرئيسية للعرض */}
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-purple-200">
        {/* النموذج الحالي */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {renderCurrentForm()}

          {/* تأثير الإضاءة */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* أزرار التنقل */}
        <button
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full p-3 shadow-xl transition-all duration-300 hover:scale-110 z-20"
          aria-label={language === 'ar' ? 'السابق' : 'Previous'}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full p-3 shadow-xl transition-all duration-300 hover:scale-110 z-20"
          aria-label={language === 'ar' ? 'التالي' : 'Next'}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* مؤشرات الشرائح */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/20 backdrop-blur-sm rounded-full px-4 py-2">
          {formTemplates.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white scale-125 shadow-lg'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`${language === 'ar' ? 'الانتقال للشريحة' : 'Go to slide'} ${index + 1}`}
            />
          ))}
        </div>

        {/* شارة "مباشر" للتبديل التلقائي */}
        {isAutoPlaying && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="font-medium">{language === 'ar' ? 'مباشر' : 'LIVE'}</span>
          </div>
        )}

        {/* رقم الشريحة */}
        <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
          {currentSlide + 1} / {formTemplates.length}
        </div>
      </div>

      {/* معلومات النموذج الحالي */}
      <div className="mt-6 text-center">
        <h4 className="text-lg font-bold text-gray-800 mb-2">
          {currentTemplate.title[language]}
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          {currentTemplate.description[language]}
        </p>

        {/* ميزات النموذج */}
        <div className="flex justify-center flex-wrap gap-2 mb-4">
          {currentTemplate.features[language].map((feature, index) => (
            <span key={index} className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">
              {feature}
            </span>
          ))}
        </div>

        <div className="flex justify-center space-x-4 text-xs text-gray-500">
          <span>✨ {language === 'ar' ? 'تصميم متجاوب' : 'Responsive'}</span>
          <span>🎨 {language === 'ar' ? 'قابل للتخصيص' : 'Customizable'}</span>
          <span>⚡ {language === 'ar' ? 'سريع التحميل' : 'Fast Loading'}</span>
        </div>
      </div>
    </div>
  );
};

export default FormSlideshow;
