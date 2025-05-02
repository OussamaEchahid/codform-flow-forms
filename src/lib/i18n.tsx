
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Define language types
type Language = 'en' | 'ar';

// Create context
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
});

// Define translations
const translations = {
  en: {
    dashboard: 'Dashboard',
    forms: 'Forms',
    orders: 'Orders',
    landingPages: 'Landing Pages',
    quickOffers: 'Quick Offers',
    quantityOffers: 'Quantity Offers',
    settings: 'Settings',
    ordersTitle: 'Orders',
    formBuilder: 'Form Builder',
    save: 'Save',
    publish: 'Publish',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    preview: 'Preview',
    newForm: 'New Form',
    formTemplates: 'Form Templates',
    elements: 'Elements',
    addElement: 'Add Element',
    formSettings: 'Form Settings',
    formDesign: 'Form Design',
    elementSettings: 'Element Settings',
    next: 'Next',
    previous: 'Previous',
    submitOrder: 'Submit Order',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    city: 'City',
    address: 'Address',
    logout: 'Logout',
    logoutSuccess: 'Logged out successfully',
    logoutError: 'Error logging out',
    connectToShopify: 'Connect to Shopify',
    shopifyConnectionIssue: 'Shopify Connection Issue',
    pleaseConnect: 'Please connect to Shopify to access forms',
    connectToShopifyNow: 'Connect to Shopify Now',
    verifyingConnection: 'Verifying connection...',
    loading: 'Loading...',
    reconnect: 'Reconnect',
    forceReconnect: 'Force Reconnect',
    createNewForm: 'Create New Form',
    editForm: 'Edit Form',
    viewForm: 'View Form'
  },
  ar: {
    dashboard: 'لوحة التحكم',
    forms: 'النماذج',
    orders: 'الطلبات',
    landingPages: 'صفحات الهبوط',
    quickOffers: 'العروض السريعة',
    quantityOffers: 'عروض الكمية',
    settings: 'الإعدادات',
    ordersTitle: 'الطلبات',
    formBuilder: 'منشئ النماذج',
    save: 'حفظ',
    publish: 'نشر',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    preview: 'معاينة',
    newForm: 'نموذج جديد',
    formTemplates: 'قوالب النماذج',
    elements: 'العناصر',
    addElement: 'إضافة عنصر',
    formSettings: 'إعدادات النموذج',
    formDesign: 'تصميم النموذج',
    elementSettings: 'إعدادات العنصر',
    next: 'التالي',
    previous: 'السابق',
    submitOrder: 'إرسال الطلب',
    fullName: 'الاسم الكامل',
    phoneNumber: 'رقم الهاتف',
    city: 'المدينة',
    address: 'العنوان',
    logout: 'تسجيل الخروج',
    logoutSuccess: 'تم تسجيل الخروج بنجاح',
    logoutError: 'حدث خطأ أثناء تسجيل الخروج',
    connectToShopify: 'الاتصال بـ Shopify',
    shopifyConnectionIssue: 'مشكلة في الاتصال بـ Shopify',
    pleaseConnect: 'يرجى الاتصال بمتجر Shopify للوصول إلى قسم النماذج',
    connectToShopifyNow: 'الاتصال بـ Shopify الآن',
    verifyingConnection: 'جاري التحقق من الاتصال...',
    loading: 'جاري التحميل...',
    reconnect: 'إعادة الاتصال',
    forceReconnect: 'إعادة اتصال إجباري',
    createNewForm: 'إنشاء نموذج جديد',
    editForm: 'تعديل النموذج',
    viewForm: 'عرض النموذج'
  }
};

// Provider component
interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider = ({ children }: I18nProviderProps) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Get language from localStorage or use browser preference or default to 'ar'
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      return savedLanguage;
    }
    
    // Default to Arabic if no language is set
    return 'ar';
  });

  // Save language to localStorage when it changes and apply RTL settings
  useEffect(() => {
    console.log('Language changed to:', language);
    localStorage.setItem('language', language);
    
    // Set RTL for Arabic
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Apply RTL class to the body element
    if (language === 'ar') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }

    // Force any components to re-render by dispatching a custom event
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    if (!key) return '';
    
    // Safely access translations with type checking
    const langTranslations = translations[language] || {};
    return (langTranslations as Record<string, string>)[key] || key;
  };

  const value: I18nContextType = {
    language,
    setLanguage: (lang: Language) => {
      console.log('Setting language to:', lang);
      setLanguage(lang);
    },
    t
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// Custom hook for using translations
export const useI18n = () => useContext(I18nContext);

