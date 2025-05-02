
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define translation types
type Language = 'ar' | 'en';
type Translations = Record<string, Record<string, string>>;

// Translation dictionary
const translations: Translations = {
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
    logoutError: 'حدث خطأ أثناء تسجيل الخروج',
    loading: 'جاري التحميل...',
    shopifyConnectionIssue: 'مشكلة في الاتصال بـ Shopify',
    pleaseConnect: 'يرجى الاتصال بمتجر Shopify الخاص بك للمتابعة',
    connectToShopifyNow: 'الاتصال بـ Shopify الآن',
    forceReconnect: 'إعادة الاتصال بالقوة',
    shopifyConnected: 'متصل بـ Shopify',
    shopifyDisconnected: 'غير متصل بـ Shopify',
    createNewForm: 'إنشاء نموذج جديد',
    useTemplate: 'استخدام قالب',
    formCreating: 'جاري إنشاء النموذج...',
    formCreated: 'تم إنشاء النموذج بنجاح',
    formCreationError: 'حدث خطأ أثناء إنشاء النموذج',
    noForms: 'لا توجد نماذج متاحة',
    createFormPrompt: 'أنشئ نموذجًا جديدًا أو استخدم قالبًا للبدء',
    editForm: 'تعديل النموذج',
    viewEditForm: 'عرض وتعديل',
    formSettings: 'إعدادات النموذج',
    formPublished: 'منشور',
    formDraft: 'مسودة',
    publishForm: 'نشر النموذج',
    unpublishForm: 'إلغاء نشر النموذج',
    deleteForm: 'حذف النموذج',
    deleteFormConfirm: 'هل أنت متأكد من حذف النموذج؟',
    deleteFormWarning: 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف النموذج بشكل دائم.',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    delete: 'حذف',
    redirecting: 'جاري إعادة التوجيه...'
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
    logoutError: 'Error logging out',
    loading: 'Loading...',
    shopifyConnectionIssue: 'Shopify Connection Issue',
    pleaseConnect: 'Please connect to your Shopify store to continue',
    connectToShopifyNow: 'Connect to Shopify Now',
    forceReconnect: 'Force Reconnect',
    shopifyConnected: 'Connected to Shopify',
    shopifyDisconnected: 'Not Connected to Shopify',
    createNewForm: 'Create New Form',
    useTemplate: 'Use Template',
    formCreating: 'Creating form...',
    formCreated: 'Form created successfully',
    formCreationError: 'Error creating form',
    noForms: 'No forms available',
    createFormPrompt: 'Create a new form or use a template to get started',
    editForm: 'Edit Form',
    viewEditForm: 'View and Edit',
    formSettings: 'Form Settings',
    formPublished: 'Published',
    formDraft: 'Draft',
    publishForm: 'Publish Form',
    unpublishForm: 'Unpublish Form',
    deleteForm: 'Delete Form',
    deleteFormConfirm: 'Are you sure you want to delete this form?',
    deleteFormWarning: 'This action cannot be undone. The form will be permanently deleted.',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    redirecting: 'Redirecting...'
  }
};

// Create the context
interface I18nContextType {
  t: (key: string) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Translations;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Create provider component
interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  // Get initial language from localStorage or default to Arabic
  const getInitialLanguage = (): Language => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language');
      return (savedLang === 'en' || savedLang === 'ar') ? savedLang : 'ar';
    }
    return 'ar';
  };

  const [language, setInternalLanguage] = useState<Language>(getInitialLanguage());

  // Update language and store preference
  const setLanguage = (lang: Language) => {
    console.log(`Changing language to: ${lang}`);
    localStorage.setItem('language', lang);
    setInternalLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // Dispatch custom event for components that need to react to language change
    const event = new CustomEvent('languageChanged', { detail: { language: lang } });
    window.dispatchEvent(event);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  // Set document direction based on language on mount and language change
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    console.log(`Language set to: ${language}, direction: ${document.documentElement.dir}`);
  }, [language]);

  // Context value
  const contextValue: I18nContextType = {
    t,
    language,
    setLanguage,
    translations
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// Custom hook to use i18n
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  
  return context;
};
