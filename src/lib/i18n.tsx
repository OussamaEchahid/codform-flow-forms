
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: () => 'ltr' | 'rtl';
}

const translations: Record<string, Record<Language, string>> = {
  loading: {
    en: 'Loading...',
    ar: 'جار التحميل...'
  },
  shopifyConnectionIssue: {
    en: 'Shopify Connection Issue',
    ar: 'مشكلة في الاتصال بـ Shopify'
  },
  pleaseConnect: {
    en: 'Please connect your Shopify store to continue using this application.',
    ar: 'يرجى الاتصال بمتجر Shopify للاستمرار في استخدام هذا التطبيق.'
  },
  connectToShopifyNow: {
    en: 'Connect to Shopify Now',
    ar: 'الاتصال بـ Shopify الآن'
  },
  forceReconnect: {
    en: 'Force Reconnect',
    ar: 'إعادة الاتصال بشكل إجباري'
  },
  'shopify.integration': {
    en: 'Shopify Integration',
    ar: 'تكامل Shopify'
  },
  'shopify.connection_required': {
    en: 'You need to connect to Shopify to use this feature.',
    ar: 'تحتاج إلى الاتصال بـ Shopify لاستخدام هذه الميزة.'
  },
  'shopify.connect_now': {
    en: 'Connect to Shopify',
    ar: 'الاتصال بـ Shopify'
  },
  'shopify.connected': {
    en: 'Connected to Shopify',
    ar: 'متصل بـ Shopify'
  }
};

// Create I18n context
const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
  dir: () => 'ltr'
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Try to get language from localStorage, default to en
  const [language, setLanguageState] = useState<Language>(
    () => {
      try {
        const savedLanguage = localStorage.getItem('language');
        return (savedLanguage === 'ar' || savedLanguage === 'en') 
          ? savedLanguage 
          : 'en';
      } catch {
        return 'en';
      }
    }
  );

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('language', lang);
      // Update document direction
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const dir = (): 'ltr' | 'rtl' => {
    return language === 'ar' ? 'rtl' : 'ltr';
  };

  // Set initial document direction
  React.useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
};
