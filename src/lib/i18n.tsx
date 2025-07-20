
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
    quantityOffersDescription: 'Create quantity-based offers for your products',
    selectProduct: 'Select Product',
    selectForm: 'Select Form',
    selectedProduct: 'Selected Product',
    selectedForm: 'Selected Form',
    createNewOffer: 'Create New Offer',
    next: 'Next',
    back: 'Back',
    saveAndContinue: 'Save & Continue',
    fields: 'fields',
    offers: 'Offers',
    styling: 'Styling',
    position: 'Position',
    addOffer: 'Add Offer',
    offer: 'Offer',
    tag: 'Tag',
    quantity: 'Quantity',
    offerText: 'Offer Text',
    discountType: 'Discount Type',
    discountValue: 'Discount Value',
    noDiscount: 'No Discount',
    fixedAmount: 'Fixed Amount',
    percentage: 'Percentage',
    noOffersYet: 'No offers created yet',
    backgroundColor: 'Background Color',
    textColor: 'Text Color',
    tagColor: 'Tag Color',
    priceColor: 'Price Color',
    offerPosition: 'Offer Position',
    beforeForm: 'Before Form',
    insideForm: 'Inside Form',
    afterForm: 'After Form',
    customSelector: 'Custom Selector',
    livePreview: 'Live Preview',
    saving: 'Saving...',
    saveOffer: 'Save Offer',
    freeGift: 'Free Gift',
    buy3Get1Free: 'Buy 3 and get 1 free',
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
    success_message: 'Your request has been submitted successfully. We will contact you soon.',
    
    // Settings translations
    orderSettings: 'Order Settings',
    generalSettings: 'General Settings',
    spamSettings: 'Block Spam',
    plansSettings: 'Plans',
    settingsDescription: 'Manage application settings and features',
    orderSettingsDescription: 'Manage post-order creation settings',
    generalSettingsDescription: 'Manage general application settings',
    spamSettingsDescription: 'Manage block list to prevent annoying visitors',
    plansSettingsDescription: 'Manage subscription plans and upgrades',
    
    // Order Settings
    postOrderAction: 'Post-Order Action',
    postOrderActionDescription: 'Choose what happens after successful order creation',
    redirectToPage: 'Redirect to Page',
    redirectEnabled: 'Enable Redirect',
    thankYouPageUrl: 'Thank You Page URL',
    popupSettings: 'Popup Settings',
    popupTitle: 'Title',
    popupMessage: 'Message',
    popupSettingsDescription: 'Customize the popup that appears after order creation',
    
    // General Settings
    shopifySettings: 'Shopify Settings',
    shopifySettingsDescription: 'Customize Shopify integration',
    showShopifyButton: 'Show Shopify Purchase Button',
    orderPaymentStatus: 'Order Payment Status',
    dailyOrderLimit: 'Daily Order Limit Per Visitor',
    outOfStockMessage: 'Out of Stock Message',
    shippingByTotal: 'Shipping by Order Total',
    shippingRatesDescription: 'Setup shipping rates by price ranges',
    
    // Spam Settings
    blockIP: 'Block IP Address',
    blockedIPsList: 'Blocked IPs List',
    ipAddress: 'IP Address',
    blockDate: 'Block Date',
    actions: 'Actions',
    removeBlock: 'Remove Block',
    noBlockedIPs: 'No blocked IP addresses',
    
    // Plans Settings
    currentPlan: 'Current',
    mostPopular: 'Most Popular',
    basicPlan: 'Basic Plan',
    advancedPlan: 'Advanced Plan',
    professionalPlan: 'Professional Plan',
    upgradeNow: 'Upgrade Now',
    contactUs: 'Contact Us',
    currentSubscription: 'Current Subscription Information',
    formsUsed: 'Forms Used',
    ordersThisMonth: 'Orders This Month',
    storageUsed: 'Storage Used',
    renewalDate: 'Renewal Date',
    
    // Common
    addRate: 'Add Rate',
    minAmount: 'Minimum Amount',
    maxAmount: 'Maximum Amount',
    shippingCost: 'Shipping Cost',
    saveSettings: 'Save Settings'
  },
  ar: {
    dashboard: 'لوحة التحكم',
    forms: 'النماذج',
    orders: 'الطلبات',
    landingPages: 'صفحات الهبوط',
    quickOffers: 'العروض السريعة',
    quantityOffers: 'عروض الكمية',
    quantityOffersDescription: 'أنشئ عروض كمية لمنتجاتك',
    selectProduct: 'اختر المنتج',
    selectForm: 'اختر النموذج',
    selectedProduct: 'المنتج المختار',
    selectedForm: 'النموذج المختار',
    createNewOffer: 'إنشاء عرض جديد',
    next: 'التالي',
    back: 'السابق',
    saveAndContinue: 'حفظ ومتابعة',
    fields: 'حقول',
    offers: 'العروض',
    styling: 'التصميم',
    position: 'الموضع',
    addOffer: 'إضافة عرض',
    offer: 'عرض',
    tag: 'العلامة',
    quantity: 'الكمية',
    offerText: 'نص العرض',
    discountType: 'نوع الخصم',
    discountValue: 'قيمة الخصم',
    noDiscount: 'بدون خصم',
    fixedAmount: 'مبلغ ثابت',
    percentage: 'نسبة مئوية',
    noOffersYet: 'لم يتم إنشاء عروض بعد',
    backgroundColor: 'لون الخلفية',
    textColor: 'لون النص',
    tagColor: 'لون العلامة',
    priceColor: 'لون السعر',
    offerPosition: 'موضع العرض',
    beforeForm: 'قبل النموذج',
    insideForm: 'داخل النموذج',
    afterForm: 'بعد النموذج',
    customSelector: 'محدد مخصص',
    livePreview: 'معاينة حية',
    saving: 'جاري الحفظ...',
    saveOffer: 'حفظ العرض',
    freeGift: 'هدية مجانية',
    buy3Get1Free: 'اشتر 3 واحصل على 1 مجانًا',
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
    success_message: 'تم إرسال طلبك بنجاح. سنتواصل معك قريبًا.',
    
    // Settings translations
    orderSettings: 'إعدادات الطلب',
    generalSettings: 'الإعدادات العامة',
    spamSettings: 'حظر السبام',
    plansSettings: 'الخطط',
    settingsDescription: 'إدارة إعدادات التطبيق والوظائف',
    orderSettingsDescription: 'إدارة إعدادات ما بعد إنشاء الطلب',
    generalSettingsDescription: 'إدارة الإعدادات العامة للتطبيق',
    spamSettingsDescription: 'إدارة قائمة الحظر لمنع الزوار المزعجين',
    plansSettingsDescription: 'إدارة خطط الاشتراك والترقية',
    
    // Order Settings
    postOrderAction: 'الإجراء بعد إنشاء الطلب',
    postOrderActionDescription: 'اختر ما يحدث بعد إنشاء الطلب بنجاح',
    redirectToPage: 'إعادة التوجيه إلى صفحة',
    redirectEnabled: 'تفعيل إعادة التوجيه',
    thankYouPageUrl: 'رابط صفحة الشكر',
    popupSettings: 'إعدادات النافذة المنبثقة',
    popupTitle: 'العنوان',
    popupMessage: 'الرسالة',
    popupSettingsDescription: 'تخصيص النافذة المنبثقة التي تظهر بعد إنشاء الطلب',
    
    // General Settings
    shopifySettings: 'إعدادات Shopify',
    shopifySettingsDescription: 'تخصيص التكامل مع Shopify',
    showShopifyButton: 'إظهار زر الشراء عبر Shopify',
    orderPaymentStatus: 'حالة دفع الطلب',
    dailyOrderLimit: 'الحد الأقصى للطلبات اليومية لكل زائر',
    outOfStockMessage: 'رسالة عند نفاد المخزون',
    shippingByTotal: 'الشحن حسب السعر الإجمالي للطلب',
    shippingRatesDescription: 'إعداد أسعار الشحن حسب نطاقات الأسعار',
    
    // Spam Settings
    blockIP: 'حظر عنوان IP',
    blockedIPsList: 'قائمة العناوين المحظورة',
    ipAddress: 'عنوان IP',
    blockDate: 'تاريخ الحظر',
    actions: 'الإجراءات',
    removeBlock: 'إزالة الحظر',
    noBlockedIPs: 'لا توجد عناوين IP محظورة',
    
    // Plans Settings
    currentPlan: 'الحالية',
    mostPopular: 'الأكثر شعبية',
    basicPlan: 'الخطة الأساسية',
    advancedPlan: 'الخطة المتقدمة',
    professionalPlan: 'الخطة الاحترافية',
    upgradeNow: 'ترقية الآن',
    contactUs: 'اتصل بنا',
    currentSubscription: 'معلومات الاشتراك الحالي',
    formsUsed: 'النماذج المستخدمة',
    ordersThisMonth: 'الطلبات هذا الشهر',
    storageUsed: 'التخزين المستخدم',
    renewalDate: 'تاريخ التجديد',
    
    // Common
    addRate: 'إضافة سعر',
    minAmount: 'الحد الأدنى',
    maxAmount: 'الحد الأقصى',
    shippingCost: 'تكلفة الشحن',
    saveSettings: 'حفظ الإعدادات'
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
