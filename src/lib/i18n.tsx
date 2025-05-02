import React, { createContext, useContext, useState, useEffect } from 'react';

// Available languages
type Language = 'en' | 'ar';

// Interface for i18n context
interface I18nContextType {
  t: (key: string) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
}

// Translations
const translations = {
  en: {
    loading: 'Loading...',
    forms: 'Forms',
    useTemplate: 'Use Template',
    createNewForm: 'Create New Form',
    formCreating: 'Creating Form...',
    noForms: 'No forms available',
    createFormPrompt: 'Click "Create New Form" to add a form',
    shopifyConnectionIssue: 'Shopify Connection Issue',
    pleaseConnect: 'Please connect to Shopify to use form features',
    connectToShopifyNow: 'Connect to Shopify Now',
    forceReconnect: 'Force Reconnect',
    authError: 'Authentication Error',
    pleaseLogin: 'Please login to continue',
  },
  ar: {
    loading: 'جار التحميل...',
    forms: 'النماذج',
    useTemplate: 'استخدام قالب',
    createNewForm: 'إنشاء نموذج جديد',
    formCreating: 'جاري إنشاء النموذج...',
    noForms: 'لا توجد نماذج متاحة',
    createFormPrompt: 'انقر على "إنشاء نموذج جديد" لإضافة نموذج',
    shopifyConnectionIssue: 'مشكلة في الاتصال بـ Shopify',
    pleaseConnect: 'يرجى الاتصال بـ Shopify لاستخدام ميزات النماذج',
    connectToShopifyNow: 'الاتصال بـ Shopify الآن',
    forceReconnect: 'إعادة الاتصال الإجباري',
    authError: 'خطأ في المصادقة',
    pleaseLogin: 'يرجى تسجيل الدخول للمتابعة',
  }
};

// Create context
const I18nContext = createContext<I18nContextType>({
  t: (key) => key,
  language: 'en',
  setLanguage: () => {},
});

// Event to notify when language changes
export const createLanguageChangeEvent = (language: string) => {
  const event = new CustomEvent('languageChange', { detail: { language } });
  document.dispatchEvent(event);
  return event;
};

// Provider component
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage or default to 'ar'
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });
  
  // Set document direction based on language
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', language);
    
    // Dispatch language change event for components that need to react
    createLanguageChangeEvent(language);
  }, [language]);
  
  // Translation function
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };
  
  // Change language and update localStorage
  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };
  
  return (
    <I18nContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook to use i18n in components
export const useI18n = () => useContext(I18nContext);

// Ensure the file also re-exports everything for backward compatibility
export * from './i18n';
