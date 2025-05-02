
import { useState, useContext, createContext } from 'react';

interface I18nContextType {
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  
  // Very simple translation function, in a real app you'd use a proper i18n library
  const t = (key: string): string => {
    // Add translations here
    return key;
  };
  
  return {
    element: I18nContext.Provider,
    props: {
      value: { language, setLanguage, t },
      children
    }
  };
};

export const useI18n = () => useContext(I18nContext);
