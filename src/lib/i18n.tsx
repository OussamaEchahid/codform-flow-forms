
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
    plansSettings: 'Plans',
    settingsDescription: 'Manage application settings and features',
    orderSettingsDescription: 'Manage post-order creation settings',
    generalSettingsDescription: 'Manage general application settings',
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
    saveSettings: 'Save Settings',
    
    // Dashboard and Welcome
    welcomeToDashboard: 'Welcome to Dashboard',
    connectedToStore: 'Connected to store',
    setupShopifyStore: 'Set up your Shopify store to get started',
    manageStores2: 'Manage Stores',
    connectToShopify: 'Connect to Shopify',
    
    // Form Builder
    welcomeToFormBuilder: 'Welcome to Form Builder',
    noFormsFound: 'No forms found. Start by creating your first form to collect customer data and increase sales.',
    createNewForm: 'Create New Form',
    defaultFormDescription: 'A default form will be created with basic fields that you can customize later',
    
    // No Store Connected
    welcomeToCODmagnet: 'Welcome to CODmagnet',
    accountCreatedSuccessfully: 'Your account has been created successfully, but no Shopify store is connected yet',
    whyConnectStore: 'Why do I need to connect a store?',
    createCustomCODForms: 'Create custom cash on delivery forms',
    linkFormsToProducts: 'Link forms to your products automatically',
    trackOrdersAndStats: 'Track orders and statistics',
    manageOffersAndDiscounts: 'Manage offers and discounts',
    connectShopifyForBestExperience: 'For the best experience, please connect your Shopify store',
    connectShopifyStore: 'Connect Shopify Store',
    setupProfile: 'Setup Profile',
    alreadyHaveShopifyStore: 'Already have a Shopify store?',
    downloadFromAppStore: 'Download from App Store',
    
    // Countdown Timer
    offerEndsIn: 'Offer ends in',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    
    // HTML Content
    addHtmlContentHere: 'Add HTML content here. You can add paragraphs, images, links and more.',
    
    // Dashboard additional
    totalStores: 'Total Stores',
    totalForms: 'Total Forms',  
    totalOrders: 'Total Orders',
    connectedStore: 'Connected Store',
    formsCreated: 'forms created',
    ordersReceived: 'orders received',
    currentPlanText: 'Current Plan',
    connectedTo: 'Connected to',
    active: 'Active',
    manageStores: 'Manage Stores',
    linkStore: 'Link Store',
    noActiveStore: 'No active store',
    pleaseConnectShopify: 'Please connect a Shopify store first',
    
    // Quantity Offers
    quantityOffersTitle: 'Quantity Offers',
    selectFormFirst: 'Select Form First',
    noFormsAvailable: 'No forms available',
    createFormFirst: 'Create a form first',
    associatedProducts: 'Associated Products',
    noProductsAssociated: 'No products associated with this form',
    linkProductsFirst: 'Link products to this form first',
    editOffer: 'Edit Offer',
    deleteOffer: 'Delete Offer',
    existingOffers: 'Existing Offers',
    noOffersCreated: 'No offers created yet',
    selectProductFromForm: 'Select a product from this form',
    productAlreadyHasOffer: 'Product already has a quantity offer for this form',
    editExistingOffer: 'You can edit the existing offer or choose another product',
    addAtLeastOneOffer: 'Must add at least one offer',
    offerSavedSuccessfully: 'Offer saved successfully',
    offerUpdatedSuccessfully: 'Offer updated successfully',
    failedToSaveOffer: 'Failed to save offer',
    unknownError: 'Unknown error',
    quantityOffersOffers: 'Offers',
    quantityOffersStyling: 'Styling',
    quantityOffersPosition: 'Position',
    
    // My Stores
    myStores: 'My Stores',
    yourStores: 'Your Stores',
    noStoresConnected: 'No stores connected to your account currently',
    openShopifyAdmin: 'Open Shopify Admin',
    pleaseOpenFromShopify: 'Please open the app from within your store in Shopify',
    currentActiveStore: 'Current Active Store',
    allConnectedStores: 'All Your Connected Stores',
    lastUpdate: 'Last update',
    activate: 'Activate',
    manage: 'Manage',
    disconnectAllStores: 'Disconnect All Stores',
    
    // Landing Pages
    landingPagesTitle: 'Landing Pages',
    workInProgress: 'We are working to complete this as soon as possible',
    comingSoon: 'Coming Soon',
    
    // Quantity Offers Form Labels
    step1SelectForm: 'Step 1: Select Form',
    selectFormDescription: 'Choose the form to add quantity offers to',
    noPublishedForms: 'No published forms',
    createFormFirstMessage: 'Please create and publish a form first',
    step2SelectProduct: 'Step 2: Select Product',
    productsAlreadyLinked: 'Products already linked to this form:',
    shopifyNotConnected: 'Shopify store not connected',
    connectShopifyFirst: 'Please connect a Shopify store first',
    loadingProducts: 'Loading products from Shopify...',
    noProductsLinkedToForm: 'No products linked to this form',
    noProductsInShopify: 'No products in Shopify store',
    linkProductsToForm: 'Link products to this form from the forms page first',
    reloadProducts: 'Reload Products',
    alreadyLinked: 'Already Linked',
    step3SetupOffer: 'Step 3: Setup Offer',
    offerNumber: 'Offer #',
    noOffersYetDesc: 'No offers yet. Add an offer to get started.',
    customCSSSelector: 'Custom CSS Selector',
    updateOffer: 'Update Offer',
    enabled: 'Enabled',
    disabled: 'Disabled',
    offersConfigured: 'offers configured',
    positionPrefix: 'Position:',
    additionalOffers: 'additional offers',
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
    plansSettings: 'الخطط',
    settingsDescription: 'إدارة إعدادات التطبيق والوظائف',
    orderSettingsDescription: 'إدارة إعدادات ما بعد إنشاء الطلب',
    generalSettingsDescription: 'إدارة الإعدادات العامة للتطبيق',
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
    saveSettings: 'حفظ الإعدادات',
    
    // Dashboard and Welcome
    welcomeToDashboard: 'مرحباً بك في لوحة التحكم',
    connectedToStore: 'متصل بمتجر',
    setupShopifyStore: 'قم بإعداد متجر Shopify الخاص بك للبدء',
    manageStores2: 'إدارة المتاجر',
    connectToShopify: 'اتصل بـ Shopify',
    
    // Form Builder
    welcomeToFormBuilder: 'أهلاً بك في منشئ النماذج',
    noFormsFound: 'لم يتم العثور على أي نماذج. ابدأ بإنشاء نموذجك الأول لجمع بيانات العملاء وزيادة المبيعات.',
    createNewForm: 'إنشاء نموذج جديد',
    defaultFormDescription: 'سيتم إنشاء نموذج افتراضي يحتوي على الحقول الأساسية التي يمكنك تخصيصها لاحقاً',
    
    // No Store Connected
    welcomeToCODmagnet: 'مرحباً بك في CODmagnet',
    accountCreatedSuccessfully: 'تم إنشاء حسابك بنجاح، لكن لا يوجد متجر Shopify مرتبط بعد',
    whyConnectStore: 'لماذا أحتاج إلى ربط متجر؟',
    createCustomCODForms: 'إنشاء نماذج الدفع عند الاستلام المخصصة',
    linkFormsToProducts: 'ربط النماذج بمنتجاتك تلقائياً',
    trackOrdersAndStats: 'متابعة الطلبات والإحصائيات',
    manageOffersAndDiscounts: 'إدارة العروض والخصومات',
    connectShopifyForBestExperience: 'للحصول على أفضل تجربة، يُرجى ربط متجر Shopify الخاص بك',
    connectShopifyStore: 'ربط متجر Shopify',
    setupProfile: 'إعداد الملف الشخصي',
    alreadyHaveShopifyStore: 'لديك متجر Shopify بالفعل؟',
    downloadFromAppStore: 'حمّل التطبيق من متجر التطبيقات',
    
    // Countdown Timer
    offerEndsIn: 'الوقت المتبقي للعرض',
    hours: 'ساعة',
    minutes: 'دقيقة',
    seconds: 'ثانية',
    
    // HTML Content
    addHtmlContentHere: 'أضف محتوى HTML هنا. يمكنك إضافة فقرات، صور، روابط وغيرها.',
    
    // Dashboard additional
    totalStores: 'إجمالي المتاجر',
    totalForms: 'إجمالي النماذج',
    totalOrders: 'إجمالي الطلبات', 
    connectedStore: 'المتجر المتصل',
    formsCreated: 'نماذج تم إنشاؤها',
    ordersReceived: 'طلبات تم استلامها',
    currentPlanText: 'الخطة الحالية',
    connectedTo: 'متصل بـ',
    active: 'نشط',
    manageStores: 'إدارة المتاجر',
    linkStore: 'ربط متجر',
    noActiveStore: 'لا يوجد متجر نشط',
    pleaseConnectShopify: 'يرجى ربط متجر Shopify أولاً',
    
    // Quantity Offers
    quantityOffersTitle: 'العروض الكمية',
    selectFormFirst: 'اختر النموذج أولاً',
    noFormsAvailable: 'لا توجد نماذج متاحة',
    createFormFirst: 'أنشئ نموذجاً أولاً',
    associatedProducts: 'المنتجات المرتبطة',
    noProductsAssociated: 'لا توجد منتجات مرتبطة بهذا النموذج',
    linkProductsFirst: 'اربط المنتجات بهذا النموذج أولاً',
    editOffer: 'تعديل العرض',
    deleteOffer: 'حذف العرض',
    existingOffers: 'العروض الموجودة',
    noOffersCreated: 'لم يتم إنشاء عروض بعد',
    selectProductFromForm: 'اختر منتجاً من هذا النموذج',
    productAlreadyHasOffer: 'المنتج لديه بالفعل عرض كمية لهذا النموذج',
    editExistingOffer: 'يمكنك تعديل العرض الموجود أو اختيار منتج آخر',
    addAtLeastOneOffer: 'يجب إضافة عرض واحد على الأقل',
    offerSavedSuccessfully: 'تم حفظ العرض بنجاح',
    offerUpdatedSuccessfully: 'تم تحديث العرض بنجاح',
    failedToSaveOffer: 'فشل في حفظ العرض',
    unknownError: 'خطأ غير معروف',
    quantityOffersOffers: 'العروض',
    quantityOffersStyling: 'التصميم',
    quantityOffersPosition: 'الموضع',
    
    // My Stores
    myStores: 'متاجري',
    yourStores: 'متاجرك',
    noStoresConnected: 'لا توجد متاجر متصلة بحسابك حالياً',
    openShopifyAdmin: 'فتح Shopify Admin',
    pleaseOpenFromShopify: 'يرجى فتح التطبيق من داخل متجرك في Shopify',
    currentActiveStore: 'المتجر النشط حالياً',
    allConnectedStores: 'جميع متاجرك المتصلة',
    lastUpdate: 'آخر تحديث',
    activate: 'تفعيل',
    manage: 'إدارة',
    disconnectAllStores: 'قطع الاتصال من جميع المتاجر',
    
    // Landing Pages
    landingPagesTitle: 'صفحات الهبوط',
    workInProgress: 'نحن نعمل على إنجاز هذا في أقرب وقت ممكن',
    comingSoon: 'قريباً',
    
    // Quantity Offers Form Labels
    step1SelectForm: 'الخطوة 1: اختيار النموذج',
    selectFormDescription: 'اختر النموذج المراد إضافة عروض الكمية إليه',
    noPublishedForms: 'لا توجد نماذج منشورة',
    createFormFirstMessage: 'يرجى إنشاء ونشر نموذج أولاً',
    step2SelectProduct: 'الخطوة 2: اختيار المنتج',
    productsAlreadyLinked: 'المنتجات المرتبطة مسبقاً بهذا النموذج:',
    shopifyNotConnected: 'متجر Shopify غير متصل',
    connectShopifyFirst: 'يرجى ربط متجر Shopify أولاً',
    loadingProducts: 'جاري تحميل المنتجات من Shopify...',
    noProductsLinkedToForm: 'لا توجد منتجات مرتبطة بهذا النموذج',
    noProductsInShopify: 'لا توجد منتجات في متجر Shopify',
    linkProductsToForm: 'قم بربط المنتجات بهذا النموذج من صفحة النماذج أولاً',
    reloadProducts: 'إعادة تحميل المنتجات',
    alreadyLinked: 'مرتبط مسبقاً',
    step3SetupOffer: 'الخطوة 3: إعداد العرض',
    offerNumber: 'عرض #',
    noOffersYetDesc: 'لا توجد عروض بعد. أضف عرضاً للبدء.',
    customCSSSelector: 'محدد CSS المخصص',
    updateOffer: 'تحديث العرض',
    enabled: 'نشط',
    disabled: 'معطل',
    offersConfigured: 'عرض مُهيأ',
    positionPrefix: 'الموضع:',
    additionalOffers: 'عرض إضافي',
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
