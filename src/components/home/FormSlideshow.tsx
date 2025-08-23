import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, Clock, Shield, Truck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// بيانات النماذج الأربع
const formTemplates = [
  {
    id: 1,
    type: 'arabic-quantity',
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
    type: 'black-white',
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

// مكون النموذج العربي مع عروض الكمية
const ArabicQuantityForm: React.FC = () => (
  <div className="bg-white rounded-xl p-6 h-full flex flex-col" dir="rtl">
    <div className="text-center mb-4">
      <h3 className="text-lg font-bold text-gray-800 mb-2">اطلب الآن</h3>
    </div>

    {/* عروض الكمية */}
    <div className="space-y-3 mb-4">
      <div className="border-2 border-green-400 rounded-lg p-3 bg-green-50">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">اشتر 3 واحصل على 2 مجانًا</span>
          <span className="text-green-600 font-bold">MAD 5000</span>
        </div>
        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded mt-1 inline-block">
          هدية مجانية
        </div>
      </div>
      <div className="border rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">اشتر 5 واحصل على 1 مجانًا</span>
          <span className="font-bold">MAD 3000</span>
        </div>
      </div>
    </div>

    {/* حقول النموذج */}
    <div className="space-y-3 flex-1">
      <input className="w-full p-2 border rounded text-sm" placeholder="الاسم الكامل" />
      <input className="w-full p-2 border rounded text-sm" placeholder="رقم الهاتف" />
      <input className="w-full p-2 border rounded text-sm" placeholder="المدينة" />
      <textarea className="w-full p-2 border rounded text-sm h-16" placeholder="العنوان الكامل" />
    </div>

    {/* المجموع */}
    <div className="mt-4 pt-3 border-t">
      <div className="flex justify-between text-sm mb-1">
        <span>المجموع الفرعي</span>
        <span>MAD 5000</span>
      </div>
      <div className="flex justify-between font-bold text-green-600">
        <span>المجموع الكلي</span>
        <span>MAD 5000</span>
      </div>
    </div>

    <button className="w-full bg-purple-600 text-white py-3 rounded-lg mt-4 font-medium">
      إرسال الطلب
    </button>
  </div>
);

// مكون النموذج الأزرق العصري
const BlueModernForm: React.FC = () => (
  <div className="bg-gradient-to-b from-blue-50 to-white rounded-xl p-6 h-full flex flex-col border-2 border-blue-200">
    <div className="text-center mb-4">
      <div className="w-12 h-12 bg-blue-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
        <span className="text-white text-xl">📱</span>
      </div>
      <h3 className="text-lg font-bold text-blue-800">UPLOAD LOGO</h3>
    </div>

    <div className="space-y-3 flex-1">
      <div className="relative">
        <input className="w-full p-3 border-2 border-blue-200 rounded-lg text-sm pl-10" placeholder="Full Name *" />
        <span className="absolute left-3 top-3 text-blue-400">👤</span>
      </div>
      <div className="relative">
        <input className="w-full p-3 border-2 border-blue-200 rounded-lg text-sm pl-10" placeholder="Phone Number *" />
        <span className="absolute left-3 top-3 text-blue-400">📞</span>
      </div>
      <div className="relative">
        <input className="w-full p-3 border-2 border-blue-200 rounded-lg text-sm pl-10" placeholder="City *" />
        <span className="absolute left-3 top-3 text-blue-400">📍</span>
      </div>
      <textarea className="w-full p-3 border-2 border-blue-200 rounded-lg text-sm h-16" placeholder="Address *" />
    </div>

    <div className="mt-4 pt-3 border-t border-blue-200">
      <div className="flex justify-between text-sm mb-1">
        <span>Subtotal</span>
        <span>100 USD</span>
      </div>
      <div className="flex justify-between text-sm mb-1">
        <span>Shipping</span>
        <span className="text-green-600">Free</span>
      </div>
      <div className="flex justify-between font-bold text-green-600">
        <span>Total</span>
        <span>100 USD</span>
      </div>
    </div>

    <button className="w-full bg-blue-500 text-white py-3 rounded-lg mt-4 font-medium flex items-center justify-center">
      <ShoppingCart className="w-4 h-4 mr-2" />
      Submit Order
    </button>

    {/* شارات الثقة */}
    <div className="flex justify-center space-x-2 mt-3">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <Truck className="w-4 h-4 text-blue-600" />
      </div>
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <Shield className="w-4 h-4 text-blue-600" />
      </div>
    </div>
  </div>
);

const FormSlideshow: React.FC = () => {
  const { language } = useI18n();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

// مكون النموذج الأبيض والأسود
const BlackWhiteForm: React.FC = () => (
  <div className="bg-white rounded-xl p-6 h-full flex flex-col border-2 border-gray-300">
    <div className="text-center mb-4">
      <h3 className="text-lg font-bold text-gray-800">UPLOAD LOGO</h3>
    </div>

    <div className="space-y-3 flex-1">
      <div className="relative">
        <input className="w-full p-3 border border-gray-300 rounded-lg text-sm pl-10" placeholder="Enter full name" />
        <span className="absolute left-3 top-3 text-gray-400">👤</span>
      </div>
      <div className="relative">
        <input className="w-full p-3 border border-gray-300 rounded-lg text-sm pl-10" placeholder="Enter phone number" />
        <span className="absolute left-3 top-3 text-gray-400">📞</span>
      </div>
      <div className="relative">
        <input className="w-full p-3 border border-gray-300 rounded-lg text-sm pl-10" placeholder="Enter city" />
        <span className="absolute left-3 top-3 text-gray-400">📍</span>
      </div>
      <textarea className="w-full p-3 border border-gray-300 rounded-lg text-sm h-16" placeholder="Enter full address" />
    </div>

    <div className="mt-4 pt-3 border-t border-gray-200">
      <div className="flex justify-between text-sm mb-1">
        <span>Subtotal</span>
        <span>100 USD</span>
      </div>
      <div className="flex justify-between text-sm mb-1">
        <span>Shipping</span>
        <span className="text-green-600">Free</span>
      </div>
      <div className="flex justify-between font-bold text-green-600">
        <span>Total</span>
        <span>100 USD</span>
      </div>
    </div>

    <button className="w-full bg-black text-white py-3 rounded-lg mt-4 font-medium">
      Submit Order
    </button>
    <button className="w-full bg-green-500 text-white py-3 rounded-lg mt-2 font-medium flex items-center justify-center">
      <span className="mr-2">💬</span>
      Order by WhatsApp
    </button>
  </div>
);

// مكون النموذج البنفسجي مع المؤقت
const PurpleTimerForm: React.FC = () => (
  <div className="bg-gradient-to-b from-purple-100 to-white rounded-xl p-6 h-full flex flex-col border-2 border-purple-300">
    <div className="text-center mb-4">
      <h3 className="text-lg font-bold text-purple-800">Fill out the form to apply</h3>
    </div>

    <div className="space-y-3 flex-1">
      <div className="relative">
        <input className="w-full p-3 border-2 border-purple-200 rounded-lg text-sm pl-10" placeholder="Enter full name" />
        <span className="absolute left-3 top-3 text-purple-400">👤</span>
      </div>
      <div className="relative">
        <input className="w-full p-3 border-2 border-purple-200 rounded-lg text-sm pl-10" placeholder="Enter phone number" />
        <span className="absolute left-3 top-3 text-purple-400">📞</span>
      </div>
      <div className="relative">
        <input className="w-full p-3 border-2 border-purple-200 rounded-lg text-sm pl-10" placeholder="Enter city" />
        <span className="absolute left-3 top-3 text-purple-400">📍</span>
      </div>
      <textarea className="w-full p-3 border-2 border-purple-200 rounded-lg text-sm h-16" placeholder="Enter full address" />
    </div>

    <div className="mt-4 pt-3 border-t border-purple-200">
      <div className="flex justify-between text-sm mb-1">
        <span>Subtotal</span>
        <span>100 USD</span>
      </div>
      <div className="flex justify-between text-sm mb-1">
        <span>Shipping</span>
        <span className="text-green-600">Free</span>
      </div>
      <div className="flex justify-between font-bold text-green-600">
        <span>Total</span>
        <span>100 USD</span>
      </div>
    </div>

    <button className="w-full bg-purple-600 text-white py-3 rounded-lg mt-4 font-medium">
      Submit Order
    </button>

    {/* مؤقت العرض */}
    <div className="bg-purple-600 text-white rounded-lg p-3 mt-3 text-center">
      <div className="text-sm mb-1">Remaining on offer 🔥</div>
      <div className="flex justify-center space-x-2 text-lg font-bold">
        <div className="bg-white text-purple-600 px-2 py-1 rounded">01</div>
        <span>:</span>
        <div className="bg-white text-purple-600 px-2 py-1 rounded">23</div>
        <span>:</span>
        <div className="bg-white text-purple-600 px-2 py-1 rounded">59</div>
        <span>:</span>
        <div className="bg-white text-purple-600 px-2 py-1 rounded">40</div>
      </div>
      <div className="flex justify-center space-x-4 text-xs mt-1">
        <span>Days</span>
        <span>Hrs</span>
        <span>Mins</span>
        <span>Secs</span>
      </div>
    </div>
  </div>
);

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
    switch (currentTemplate.type) {
      case 'arabic-quantity':
        return <ArabicQuantityForm />;
      case 'blue-modern':
        return <BlueModernForm />;
      case 'black-white':
        return <BlackWhiteForm />;
      case 'purple-timer':
        return <PurpleTimerForm />;
      default:
        return <ArabicQuantityForm />;
    }
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
