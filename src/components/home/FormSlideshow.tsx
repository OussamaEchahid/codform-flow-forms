import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import FormPreview from './FormPreview';
import FormNavigation from './FormNavigation';
import FormInfo from './FormInfo';

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
  // ضمان استئناف التشغيل التلقائي بعد تغيير اللغة
  useEffect(() => {
    setIsAutoPlaying(true);
  }, [language]);


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

  return (
    <div className="w-full">
      {/* التخطيط المحسن - يتغير حسب اللغة */}
      <div className={`flex flex-col lg:flex-row items-center gap-8 max-w-6xl mx-auto ${
        language === 'ar' ? 'lg:flex-row-reverse' : ''
      }`}>

        {/* قسم الصورة */}
        <div className="relative w-full lg:w-1/2 max-w-md mx-auto">
          <div className="relative overflow-hidden">
            {/* النموذج الحالي */}
            <div className="relative">
              <FormPreview template={currentTemplate} />
            </div>

            {/* أزرار التنقل والمؤشرات */}
            <FormNavigation
              currentSlide={currentSlide}
              totalSlides={formTemplates.length}
              isAutoPlaying={isAutoPlaying}
              onPrevious={goToPrevious}
              onNext={goToNext}
              onGoToSlide={goToSlide}
            />
          </div>
        </div>

        {/* قسم المعلومات والوصف */}
        <FormInfo template={currentTemplate} />
      </div>
    </div>
  );
};

export default FormSlideshow;
