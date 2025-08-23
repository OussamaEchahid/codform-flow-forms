import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// بيانات النماذج الأربع مع الصور
const formTemplates = [
  {
    id: 1,
    type: 'arabic-quantity',
    imageSrc: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="#F9FAFB" stroke="#9b87f5" stroke-width="4" rx="20"/>
        <text x="200" y="50" font-family="Arial" font-size="20" font-weight="bold" fill="#374151" text-anchor="middle">اطلب الآن</text>

        <!-- عرض الكمية الأول -->
        <rect x="20" y="80" width="360" height="60" fill="#F0FDF4" stroke="#22c55e" stroke-width="2" rx="10"/>
        <text x="380" y="100" font-family="Arial" font-size="14" fill="#374151" text-anchor="end" direction="rtl">اشتر 3 واحصل على 1 مجاناً</text>
        <text x="380" y="120" font-family="Arial" font-size="18" font-weight="bold" fill="#059669" text-anchor="end">MAD 3000</text>
        <rect x="300" y="105" width="60" height="20" fill="#22c55e" rx="10"/>
        <text x="330" y="117" font-family="Arial" font-size="10" fill="#fff" text-anchor="middle">هدية مجانية</text>

        <!-- حقول الإدخال -->
        <rect x="20" y="160" width="360" height="40" fill="#fff" stroke="#ddd" stroke-width="1" rx="5"/>
        <text x="380" y="180" font-family="Arial" font-size="14" fill="#999" text-anchor="end" direction="rtl">الاسم الكامل</text>

        <rect x="20" y="220" width="360" height="40" fill="#fff" stroke="#ddd" stroke-width="1" rx="5"/>
        <text x="380" y="240" font-family="Arial" font-size="14" fill="#999" text-anchor="end" direction="rtl">رقم الهاتف</text>

        <rect x="20" y="280" width="360" height="40" fill="#fff" stroke="#ddd" stroke-width="1" rx="5"/>
        <text x="380" y="300" font-family="Arial" font-size="14" fill="#999" text-anchor="end" direction="rtl">المدينة</text>

        <rect x="20" y="340" width="360" height="80" fill="#fff" stroke="#ddd" stroke-width="1" rx="5"/>
        <text x="380" y="360" font-family="Arial" font-size="14" fill="#999" text-anchor="end" direction="rtl">العنوان الكامل</text>

        <!-- المجموع -->
        <text x="20" y="460" font-family="Arial" font-size="14" fill="#374151">مجاني</text>
        <text x="380" y="460" font-family="Arial" font-size="14" fill="#374151" text-anchor="end">MAD 5000</text>
        <text x="20" y="480" font-family="Arial" font-size="14" fill="#374151">الشحن</text>
        <text x="380" y="480" font-family="Arial" font-size="14" fill="#22c55e" text-anchor="end">مجاني</text>
        <text x="20" y="505" font-family="Arial" font-size="16" font-weight="bold" fill="#059669">المجموع الكلي</text>
        <text x="380" y="505" font-family="Arial" font-size="16" font-weight="bold" fill="#059669" text-anchor="end">MAD 5000</text>

        <!-- زر الطلب -->
        <rect x="20" y="530" width="360" height="50" fill="#9b87f5" rx="10"/>
        <text x="200" y="558" font-family="Arial" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle">إرسال الطلب</text>
      </svg>
    `)}`,
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
    imageSrc: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="#f0f9ff" stroke="#3b82f6" stroke-width="4" rx="20"/>
        <text x="200" y="40" font-family="Arial" font-size="20" font-weight="bold" fill="#374151" text-anchor="middle">UPLOAD</text>
        <text x="200" y="60" font-family="Arial" font-size="20" font-weight="bold" fill="#374151" text-anchor="middle">LOGO</text>

        <!-- حقول الإدخال -->
        <rect x="20" y="100" width="360" height="45" fill="#fff" stroke="#3b82f6" stroke-width="2" rx="8"/>
        <text x="30" y="120" font-family="Arial" font-size="14" fill="#999">Full Name *</text>
        <text x="30" y="135" font-family="Arial" font-size="12" fill="#3b82f6">👤</text>

        <rect x="20" y="160" width="360" height="45" fill="#fff" stroke="#3b82f6" stroke-width="2" rx="8"/>
        <text x="30" y="180" font-family="Arial" font-size="14" fill="#999">Phone Number *</text>
        <text x="30" y="195" font-family="Arial" font-size="12" fill="#3b82f6">📞</text>

        <rect x="20" y="220" width="360" height="45" fill="#fff" stroke="#3b82f6" stroke-width="2" rx="8"/>
        <text x="30" y="240" font-family="Arial" font-size="14" fill="#999">City *</text>
        <text x="30" y="255" font-family="Arial" font-size="12" fill="#3b82f6">📍</text>

        <rect x="20" y="280" width="360" height="80" fill="#fff" stroke="#3b82f6" stroke-width="2" rx="8"/>
        <text x="30" y="300" font-family="Arial" font-size="14" fill="#999">Address *</text>

        <!-- المجموع -->
        <text x="20" y="390" font-family="Arial" font-size="14" fill="#374151">Subtotal</text>
        <text x="380" y="390" font-family="Arial" font-size="14" fill="#374151" text-anchor="end">100 USD</text>
        <text x="20" y="410" font-family="Arial" font-size="14" fill="#374151">Shipping</text>
        <text x="380" y="410" font-family="Arial" font-size="14" fill="#22c55e" text-anchor="end">Free</text>
        <text x="20" y="435" font-family="Arial" font-size="16" font-weight="bold" fill="#22c55e">Total</text>
        <text x="380" y="435" font-family="Arial" font-size="16" font-weight="bold" fill="#22c55e" text-anchor="end">100 USD</text>

        <!-- زر الطلب -->
        <rect x="20" y="460" width="360" height="50" fill="#3b82f6" rx="10"/>
        <text x="200" y="488" font-family="Arial" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle">🛒 Submit Order</text>

        <!-- شارات الثقة -->
        <circle cx="60" cy="540" r="20" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="60" y="545" font-family="Arial" font-size="16" fill="#3b82f6" text-anchor="middle">🚚</text>
        <circle cx="140" cy="540" r="20" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="140" y="545" font-family="Arial" font-size="16" fill="#3b82f6" text-anchor="middle">🛡</text>
      </svg>
    `)}`,
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
    type: 'green-minimal',
    imageSrc: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="#f0fdf4" stroke="#22c55e" stroke-width="4" rx="20"/>
        <text x="200" y="40" font-family="Arial" font-size="24" font-weight="bold" fill="#059669" text-anchor="middle">Fast Order</text>
        <text x="200" y="65" font-family="Arial" font-size="14" fill="#666666" text-anchor="middle">Simple &amp; Secure</text>

        <!-- حقول الإدخال -->
        <rect x="20" y="100" width="360" height="50" fill="#fff" stroke="#ddd" stroke-width="1" rx="10"/>
        <text x="30" y="120" font-family="Arial" font-size="14" fill="#999">Name</text>
        <text x="350" y="135" font-family="Arial" font-size="18" fill="#22c55e" text-anchor="end">👤</text>

        <rect x="20" y="170" width="360" height="50" fill="#fff" stroke="#ddd" stroke-width="1" rx="10"/>
        <text x="30" y="190" font-family="Arial" font-size="14" fill="#999">Phone</text>
        <text x="350" y="205" font-family="Arial" font-size="18" fill="#22c55e" text-anchor="end">📞</text>

        <rect x="20" y="240" width="360" height="50" fill="#fff" stroke="#ddd" stroke-width="1" rx="10"/>
        <text x="30" y="260" font-family="Arial" font-size="14" fill="#999">City</text>
        <text x="350" y="275" font-family="Arial" font-size="18" fill="#22c55e" text-anchor="end">📍</text>

        <rect x="20" y="310" width="360" height="80" fill="#fff" stroke="#ddd" stroke-width="1" rx="10"/>
        <text x="30" y="330" font-family="Arial" font-size="14" fill="#999">Address</text>
        <text x="350" y="345" font-family="Arial" font-size="18" fill="#22c55e" text-anchor="end">📍</text>

        <!-- المجموع -->
        <rect x="20" y="420" width="360" height="60" fill="#f0fdf4" stroke="#22c55e" stroke-width="2" rx="10"/>
        <text x="30" y="440" font-family="Arial" font-size="14" fill="#059669">Total Price</text>
        <text x="350" y="440" font-family="Arial" font-size="18" font-weight="bold" fill="#059669" text-anchor="end">75 USD</text>
        <text x="30" y="460" font-family="Arial" font-size="12" fill="#22c55e">Free Shipping</text>

        <!-- زر الطلب -->
        <rect x="20" y="500" width="360" height="50" fill="#22c55e" rx="10"/>
        <text x="200" y="528" font-family="Arial" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle">Order Now</text>

        <!-- شارات الثقة -->
        <circle cx="100" cy="570" r="15" fill="#22c55e"/>
        <text x="100" y="575" font-family="Arial" font-size="12" fill="#fff" text-anchor="middle">✓</text>
        <text x="125" y="575" font-family="Arial" font-size="12" fill="#059669">Secure Payment</text>
        <circle cx="300" cy="570" r="15" fill="#22c55e"/>
        <text x="300" y="575" font-family="Arial" font-size="12" fill="#fff" text-anchor="middle">😊</text>
        <text x="325" y="575" font-family="Arial" font-size="12" fill="#059669">Fast Delivery</text>
      </svg>
    `)}`,
    title: {
      ar: 'نموذج أخضر بسيط',
      en: 'Green Minimal Form'
    },
    description: {
      ar: 'تصميم بسيط وأنيق باللون الأخضر',
      en: 'Simple and elegant green design'
    },
    theme: 'green',
    features: {
      ar: ['تصميم بسيط', 'سهولة الاستخدام', 'ألوان هادئة'],
      en: ['Simple Design', 'Easy to Use', 'Calm Colors']
    }
  },
  {
    id: 4,
    type: 'black-white',
    imageSrc: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="#fff" stroke="#333" stroke-width="4" rx="20"/>
        <text x="200" y="40" font-family="Arial" font-size="20" font-weight="bold" fill="#333" text-anchor="middle">UPLOAD</text>
        <text x="200" y="60" font-family="Arial" font-size="20" font-weight="bold" fill="#333" text-anchor="middle">LOGO</text>

        <!-- حقول الإدخال -->
        <rect x="20" y="100" width="360" height="45" fill="#fff" stroke="#ccc" stroke-width="1" rx="8"/>
        <text x="30" y="120" font-family="Arial" font-size="14" fill="#333">Full Name *</text>
        <text x="30" y="135" font-family="Arial" font-size="12" fill="#999">👤 Enter full name</text>

        <rect x="20" y="160" width="360" height="45" fill="#fff" stroke="#ccc" stroke-width="1" rx="8"/>
        <text x="30" y="180" font-family="Arial" font-size="14" fill="#333">Phone Number *</text>
        <text x="30" y="195" font-family="Arial" font-size="12" fill="#999">📞 Enter phone number</text>

        <rect x="20" y="220" width="360" height="45" fill="#fff" stroke="#ccc" stroke-width="1" rx="8"/>
        <text x="30" y="240" font-family="Arial" font-size="14" fill="#333">City *</text>
        <text x="30" y="255" font-family="Arial" font-size="12" fill="#999">📍 Enter city</text>

        <rect x="20" y="280" width="360" height="80" fill="#fff" stroke="#ccc" stroke-width="1" rx="8"/>
        <text x="30" y="300" font-family="Arial" font-size="14" fill="#333">Address *</text>
        <text x="30" y="315" font-family="Arial" font-size="12" fill="#999">Enter full address</text>

        <!-- المجموع -->
        <text x="20" y="390" font-family="Arial" font-size="14" fill="#333">Subtotal</text>
        <text x="380" y="390" font-family="Arial" font-size="14" fill="#333" text-anchor="end">100 USD</text>
        <text x="20" y="410" font-family="Arial" font-size="14" fill="#333">Shipping</text>
        <text x="380" y="410" font-family="Arial" font-size="14" fill="#22c55e" text-anchor="end">Free</text>
        <text x="20" y="435" font-family="Arial" font-size="16" font-weight="bold" fill="#22c55e">Total</text>
        <text x="380" y="435" font-family="Arial" font-size="16" font-weight="bold" fill="#22c55e" text-anchor="end">100 USD</text>

        <!-- أزرار الطلب -->
        <rect x="20" y="460" width="360" height="50" fill="#000" rx="10"/>
        <text x="200" y="488" font-family="Arial" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle">🛒 Submit Order</text>

        <rect x="20" y="520" width="360" height="50" fill="#22c55e" rx="10"/>
        <text x="200" y="548" font-family="Arial" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle">💬 Order by WhatsApp</text>
      </svg>
    `)}`,
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
    id: 5,
    type: 'purple-timer',
    imageSrc: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="#faf5ff" stroke="#9b59b6" stroke-width="4" rx="20"/>
        <text x="200" y="40" font-family="Arial" font-size="18" font-weight="bold" fill="#7c3aed" text-anchor="middle">Fill out the form to apply</text>

        <!-- حقول الإدخال -->
        <rect x="20" y="70" width="360" height="45" fill="#fff" stroke="#9b59b6" stroke-width="2" rx="8"/>
        <text x="30" y="90" font-family="Arial" font-size="14" fill="#333">Full Name *</text>
        <text x="30" y="105" font-family="Arial" font-size="12" fill="#9b59b6">👤 Enter full name</text>

        <rect x="20" y="130" width="360" height="45" fill="#fff" stroke="#9b59b6" stroke-width="2" rx="8"/>
        <text x="30" y="150" font-family="Arial" font-size="14" fill="#333">Phone Number *</text>
        <text x="30" y="165" font-family="Arial" font-size="12" fill="#9b59b6">📞 Enter phone number</text>

        <rect x="20" y="190" width="360" height="45" fill="#fff" stroke="#9b59b6" stroke-width="2" rx="8"/>
        <text x="30" y="210" font-family="Arial" font-size="14" fill="#333">City *</text>
        <text x="30" y="225" font-family="Arial" font-size="12" fill="#9b59b6">📍 Enter city</text>

        <rect x="20" y="250" width="360" height="80" fill="#fff" stroke="#9b59b6" stroke-width="2" rx="8"/>
        <text x="30" y="270" font-family="Arial" font-size="14" fill="#333">Address *</text>
        <text x="30" y="285" font-family="Arial" font-size="12" fill="#9b59b6">Enter full address</text>

        <!-- المجموع -->
        <text x="20" y="360" font-family="Arial" font-size="14" fill="#333">Subtotal</text>
        <text x="380" y="360" font-family="Arial" font-size="14" fill="#333" text-anchor="end">100 USD</text>
        <text x="20" y="380" font-family="Arial" font-size="14" fill="#333">Shipping</text>
        <text x="380" y="380" font-family="Arial" font-size="14" fill="#22c55e" text-anchor="end">Free</text>
        <text x="20" y="405" font-family="Arial" font-size="16" font-weight="bold" fill="#22c55e">Total</text>
        <text x="380" y="405" font-family="Arial" font-size="16" font-weight="bold" fill="#22c55e" text-anchor="end">100 USD</text>

        <!-- زر الطلب -->
        <rect x="20" y="430" width="360" height="50" fill="#9b59b6" rx="10"/>
        <text x="200" y="458" font-family="Arial" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle">Submit Order</text>

        <!-- مؤقت العرض -->
        <rect x="20" y="490" width="360" height="90" fill="#9b59b6" rx="10"/>
        <text x="200" y="510" font-family="Arial" font-size="14" fill="#fff" text-anchor="middle">Remaining on offer ⏰</text>

        <!-- صناديق المؤقت -->
        <rect x="40" y="525" width="60" height="40" fill="#fff" rx="5"/>
        <text x="70" y="548" font-family="Arial" font-size="18" font-weight="bold" fill="#9b59b6" text-anchor="middle">01</text>
        <text x="115" y="548" font-family="Arial" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">:</text>

        <rect x="130" y="525" width="60" height="40" fill="#fff" rx="5"/>
        <text x="160" y="548" font-family="Arial" font-size="18" font-weight="bold" fill="#9b59b6" text-anchor="middle">23</text>
        <text x="205" y="548" font-family="Arial" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">:</text>

        <rect x="220" y="525" width="60" height="40" fill="#fff" rx="5"/>
        <text x="250" y="548" font-family="Arial" font-size="18" font-weight="bold" fill="#9b59b6" text-anchor="middle">59</text>
        <text x="295" y="548" font-family="Arial" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">:</text>

        <rect x="310" y="525" width="60" height="40" fill="#fff" rx="5"/>
        <text x="340" y="548" font-family="Arial" font-size="18" font-weight="bold" fill="#9b59b6" text-anchor="middle">40</text>

        <!-- تسميات المؤقت -->
        <text x="70" y="575" font-family="Arial" font-size="10" fill="#fff" text-anchor="middle">Days</text>
        <text x="160" y="575" font-family="Arial" font-size="10" fill="#fff" text-anchor="middle">Hrs</text>
        <text x="250" y="575" font-family="Arial" font-size="10" fill="#fff" text-anchor="middle">Mins</text>
        <text x="340" y="575" font-family="Arial" font-size="10" fill="#fff" text-anchor="middle">Sec</text>
      </svg>
    `)}`,
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
