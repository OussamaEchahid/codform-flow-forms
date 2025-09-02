import React from 'react';
import { useI18n } from '@/lib/i18n';

interface FormTemplate {
  id: number;
  type: string;
  imageSrc: string;
  title: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  theme: string;
  features: {
    ar: string[];
    en: string[];
  };
}

interface FormInfoProps {
  template: FormTemplate;
}

const FormInfo: React.FC<FormInfoProps> = ({ template }) => {
  const { language } = useI18n();

  return (
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
        <p className="text-xl text-gray-600 leading-relaxed">
          {language === 'ar'
            ? 'منصة شاملة لبناء نماذج دفع مخصصة تتكامل بسلاسة مع متجرك الإلكتروني'
            : 'An all-in-one platform to build custom payment forms that integrate seamlessly with your online store'
          }
        </p>
      </div>

      {/* الأزرار المحسنة */}
      <div className={`flex flex-col sm:flex-row gap-4 ${
        language === 'ar' 
          ? 'items-center sm:items-start' 
          : 'items-center sm:items-start'
      } ${
        language === 'ar' 
          ? 'justify-center sm:justify-start' 
          : 'justify-center sm:justify-start'
      }`}>
        <button className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <span className="relative z-10 flex items-center gap-2">
            <span>{language === 'ar' ? 'ابدأ مجاناً' : 'Start Free'}</span>
            <svg className={`w-5 h-5 transition-transform ${
              language === 'ar'
                ? 'scale-x-[-1] group-hover:-translate-x-1'
                : 'group-hover:translate-x-1'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {template.title[language]}
        </h4>
        <p className="text-gray-600 mb-4 leading-relaxed">
          {template.description[language]}
        </p>

        {/* ميزات النموذج */}
        <div className={`flex flex-wrap gap-2 mb-4 ${
          language === 'ar' ? 'justify-center lg:justify-start' : 'justify-center lg:justify-start'
        }`}>
          {template.features[language].map((feature, index) => (
            <span key={index} className="bg-white text-purple-700 text-sm px-4 py-2 rounded-full shadow-sm border border-purple-200 hover:shadow-md transition-shadow">
              {feature}
            </span>
          ))}
        </div>

        <div className={`flex flex-wrap gap-4 text-sm text-gray-500 ${
          language === 'ar' ? 'justify-center lg:justify-start' : 'justify-center lg:justify-start'
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
  );
};

export default FormInfo;