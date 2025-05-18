
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Define language types
type Language = 'en' | 'ar';

// Create context
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
  isRTL: false
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
    
    // Error messages
    error_title: 'Error',
    error_message: 'An error occurred while submitting the form. Please try again',
    retry_button: 'Try Again',

    // Form fields
    form_field_name: 'Full Name',
    form_field_email: 'Email Address',
    form_field_phone: 'Phone Number',
    form_field_address: 'Address',
    form_field_city: 'City',
    form_field_notes: 'Additional Notes',
    
    // Form basics
    form_title: 'Cash on Delivery Request',
    form_description: 'Please fill out the form below to request cash on delivery',
    form_submit: 'Submit Order',
    
    // Success messages
    success_title: 'Thank You',
    success_message: 'Your request has been submitted successfully. We will contact you soon.'
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
    
    // Error messages
    error_title: 'خطأ',
    error_message: 'حدث خطأ أثناء تقديم النموذج. يرجى المحاولة مرة أخرى',
    retry_button: 'إعادة المحاولة',
    
    // Form fields
    form_field_name: 'الاسم الكامل',
    form_field_email: 'البريد الإلكتروني',
    form_field_phone: 'رقم الهاتف',
    form_field_address: 'العنوان',
    form_field_city: 'المدينة',
    form_field_notes: 'ملاحظات إضافية',
    
    // Form basics
    form_title: 'طلب الدفع عند الاستلام',
    form_description: 'يرجى ملء النموذج التالي لطلب الدفع عند الاستلام',
    form_submit: 'إرسال الطلب',
    
    // Success messages
    success_title: 'شكراً لك',
    success_message: 'تم إرسال طلبك بنجاح. سنتواصل معك قريبًا.'
  }
};

// Provider component
interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider = ({ children }: I18nProviderProps) => {
  const [language, setLanguage] = useState<Language>('en');
  const isRTL = language === 'ar';

  // Load language from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguage(savedLanguage);
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
    
    // Try to find the exact key
    const directTranslation = (langTranslations as Record<string, string>)[key];
    if (directTranslation) return directTranslation;
    
    // Handle nested keys (e.g., "codform.form.title")
    if (key.includes('.')) {
      const parts = key.split('.');
      let result: any = langTranslations;
      
      for (const part of parts) {
        if (!result || typeof result !== 'object') {
          return key; // Key not found
        }
        result = result[part];
      }
      
      if (typeof result === 'string') {
        return result;
      }
    }
    
    // If no translation was found, return the key
    return key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
};

// Custom hook for using translations
export const useI18n = () => useContext(I18nContext);
