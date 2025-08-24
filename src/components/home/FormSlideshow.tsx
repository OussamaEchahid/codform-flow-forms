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
          className="w-full h-auto object-contain"
        />
        {/* طبقة تفاعلية شفافة */}
        <div className="absolute inset-0 bg-transparent hover:bg-black hover:bg-opacity-5 transition-all duration-300 cursor-pointer" />
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
              {renderCurrentForm()}
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
        </div>

        {/* قسم المعلومات والوصف */}
        <div className={`w-full lg:w-1/2 space-y-6 ${
          language === 'ar' ? 'text-right' : 'text-left'
        }`}>
          {/* العنوان الرئيسي المحسن */}
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
              {language === 'ar' ? 'إنشاء نماذج الدفع' : 'Build Payment Forms'}
            </h2>
            <h3 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              {language === 'ar' ? 'نقداً عند الاستلام' : 'Cash on Delivery'}
            </h3>
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              {language === 'ar'
                ? 'منصة شاملة لبناء نماذج دفع مخصصة تتكامل بسلاسة مع متجرك الإلكتروني'
                : 'An all-in-one platform to build custom payment forms that integrate seamlessly with your online store'
              }
            </p>
          </div>

          {/* الأزرار المحسنة */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <span className="relative z-10 flex items-center gap-2">
                <span>{language === 'ar' ? 'ابدأ مجاناً' : 'Start Free'}</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
            </button>

            <button className="px-8 py-4 border-2 border-gray-300 hover:border-purple-500 text-gray-700 hover:text-purple-600 font-semibold rounded-2xl transition-all duration-300 hover:bg-purple-50">
              {language === 'ar' ? 'تعلم المزيد' : 'Learn More'}
            </button>
          </div>

          {/* معلومات النموذج الحالي */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
            <h4 className="text-xl font-bold text-gray-800 mb-3">
              {currentTemplate.title[language]}
            </h4>
            <p className="text-gray-600 mb-4 leading-relaxed">
              {currentTemplate.description[language]}
            </p>

            {/* ميزات النموذج */}
            <div className={`flex flex-wrap gap-2 mb-4 justify-center ${
              language === 'ar' ? 'lg:justify-start' : 'lg:justify-start'
            }`}>
              {currentTemplate.features[language].map((feature, index) => (
                <span key={index} className="bg-white text-purple-700 text-sm px-4 py-2 rounded-full shadow-sm border border-purple-200 hover:shadow-md transition-shadow">
                  {feature}
                </span>
              ))}
            </div>

            <div className={`flex flex-wrap gap-4 text-sm text-gray-500 justify-center ${
              language === 'ar' ? 'lg:justify-start' : 'lg:justify-start'
            }`}>
              <span className="flex items-center gap-1">
                <span>✨</span>
                <span>{language === 'ar' ? 'تصميم متجاوب' : 'Responsive'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span>🎨</span>
                <span>{language === 'ar' ? 'قابل للتخصيص' : 'Customizable'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span>⚡</span>
                <span>{language === 'ar' ? 'سريع التحميل' : 'Fast Loading'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSlideshow;
