
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Define language types - but we'll only use Arabic
type Language = 'ar' | 'en' | 'fr';

// Create context
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'ar', // Default to Arabic
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
  },
  fr: {
    dashboard: 'Tableau de bord',
    forms: 'Formulaires',
    orders: 'Commandes',
    landingPages: 'Pages d\'atterrissage',
    quickOffers: 'Offres rapides',
    quantityOffers: 'Offres de quantité',
    settings: 'Paramètres',
    ordersTitle: 'Commandes',
    formBuilder: 'Créateur de formulaires',
    save: 'Enregistrer',
    publish: 'Publier',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    preview: 'Aperçu',
    newForm: 'Nouveau Formulaire',
    formTemplates: 'Modèles de formulaires',
    elements: 'Éléments',
    addElement: 'Ajouter un élément',
    formSettings: 'Paramètres du formulaire',
    formDesign: 'Conception du formulaire',
    elementSettings: 'Paramètres de l\'élément',
    next: 'Suivant',
    previous: 'Précédent',
    submitOrder: 'Soumettre la commande',
    fullName: 'Nom complet',
    phoneNumber: 'Numéro de téléphone',
    city: 'Ville',
    address: 'Adresse',
  }
};

// Provider component
interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider = ({ children }: I18nProviderProps) => {
  const [language, setLanguage] = useState<Language>('ar'); // Default to Arabic

  // Load language from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar' || savedLanguage === 'fr')) {
      setLanguage(savedLanguage);
    } else {
      // Default to Arabic if no language is saved
      setLanguage('ar');
      localStorage.setItem('language', 'ar');
    }
  }, []);

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
    // Set RTL for Arabic
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    if (!key) return '';
    
    // Safely access translations with type checking
    const langTranslations = translations[language] || {};
    return (langTranslations as Record<string, string>)[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

// Custom hook for using translations
export const useI18n = () => useContext(I18nContext);
