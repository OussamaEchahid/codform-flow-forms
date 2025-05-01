
import { useState } from 'react';

// تعريف الترجمات
const translations = {
  ar: {
    dashboard: 'لوحة التحكم',
    forms: 'النماذج',
    orders: 'الطلبات',
    landingPages: 'صفحات الهبوط',
    quickOffers: 'العروض السريعة',
    quantityOffers: 'عروض الكمية',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    logoutSuccess: 'تم تسجيل الخروج بنجاح',
    logoutError: 'حدث خطأ أثناء تسجيل الخروج'
  },
  en: {
    dashboard: 'Dashboard',
    forms: 'Forms',
    orders: 'Orders',
    landingPages: 'Landing Pages',
    quickOffers: 'Quick Offers',
    quantityOffers: 'Quantity Offers',
    settings: 'Settings',
    logout: 'Logout',
    logoutSuccess: 'Logged out successfully',
    logoutError: 'Error logging out'
  }
};

type Language = 'ar' | 'en';
type TranslationKey = keyof typeof translations.ar;

export const useI18n = () => {
  const savedLanguage = localStorage.getItem('language') as Language || 'ar';
  const [language, setInternalLanguage] = useState<Language>(savedLanguage);

  // دالة تعيين اللغة مع حفظ الإعداد في التخزين المحلي
  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setInternalLanguage(lang);
    
    // تعيين اتجاه المستند حسب اللغة
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  // دالة ترجمة
  const t = (key: string): string => {
    return translations[language][key as TranslationKey] || key;
  };

  return {
    t,
    language,
    setLanguage,
    translations
  };
};
