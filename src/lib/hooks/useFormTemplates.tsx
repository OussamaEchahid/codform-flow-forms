import { useState, useEffect, useCallback } from 'react';
import { useFormStore, FormStyle } from '@/hooks/useFormStore';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { FormField, FormStep } from '@/lib/form-utils';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { formManagementService } from '@/services/FormManagementService';
import { getDefaultCountryCurrencySettings } from '@/lib/constants/countries-currencies';

// Export FormData interface
export interface FormData {
  id: string;
  title: string;
  description?: string;
  data: FormStep[];
  isPublished?: boolean;
  is_published?: boolean;
  shop_id?: string;
  created_at?: string;
  style?: FormStyle;
  country?: string; // إعدادات النموذج الأساسية (Country & Currency Settings) + علامة البلد للعرض
  currency?: string;
  phone_prefix?: string;
  associatedProducts?: Array<{
    id: string;
    title: string;
    image: string;
  }>;
}

export interface FormTemplate {
  id: number;
  title: string;
  description: string;
  primaryColor: string;
  data: FormStep[];
}

export const useFormTemplates = () => {
  const { setFormState } = useFormStore();
  const { user, shop } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [forms, setForms] = useState<FormData[]>([]);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Get current active shop ID using localStorage directly
  const getActiveShopId = () => {
    try {
      const activeStore = shop || 
                         localStorage.getItem('active_shopify_store') || 
                         localStorage.getItem('current_shopify_store') ||
                         localStorage.getItem('simple_active_store') ||
                         localStorage.getItem('shopify_store');
      
      if (activeStore && activeStore.trim() && activeStore !== 'null' && activeStore !== 'undefined') {
        console.log(`🏪 Active shop found in useFormTemplates: ${activeStore.trim()}`);
        return activeStore.trim();
      }
      
      console.log('⚠️ No active shop found in useFormTemplates');
      return '';
    } catch (error) {
      console.error('❌ Error getting active store in useFormTemplates:', error);
      return shop || '';
    }
  };

  // Track current shop to trigger refetch when it changes
  const [currentShop, setCurrentShop] = useState<string | null>(null);

  // Fetch all forms using the service
  const fetchForms = useCallback(async () => {
    try {
      setIsLoading(true);
      setOfflineMode(false);
      
      const fetchedForms = await formManagementService.fetchForms();
      setForms(fetchedForms);
      setRetryCount(0);
      
      console.log(`✅ تم جلب ${fetchedForms.length} نموذج بنجاح`);
    } catch (error) {
      console.error('خطأ في جلب النماذج:', error);
      setOfflineMode(true);
      setRetryCount(prev => prev + 1);
      
      // Try to load cached forms as fallback
      const cachedForms = localStorage.getItem('cached_forms');
      if (cachedForms) {
        try {
          const parsedForms = JSON.parse(cachedForms);
          if (Array.isArray(parsedForms) && parsedForms.length > 0) {
            setForms(parsedForms);
          }
        } catch (e) {
          console.error('Error parsing cached forms:', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove all dependencies to reduce refetching

  // Watch for shop changes and refetch forms
  useEffect(() => {
    const activeShop = getActiveShopId();
    
    if (activeShop !== currentShop) {
      console.log(`🔄 تغيير المتجر من ${currentShop} إلى ${activeShop} - إعادة جلب النماذج`);
      setCurrentShop(activeShop);
      
      if (activeShop) {
        // Clear current forms before fetching new ones
        setForms([]);
        fetchForms();
      } else {
        // No active shop, clear forms
        setForms([]);
      }
    }
  }, [currentShop, fetchForms]);

  // Initial load
  useEffect(() => {
    const activeShop = getActiveShopId();
    if (activeShop && !currentShop) {
      setCurrentShop(activeShop);
      fetchForms();
    }
  }, [fetchForms, currentShop]);

  // Create a form from template
  const createFormFromTemplate = async (templateId: number) => {
    try {
      setIsLoading(true);
      const template = formTemplates.find(t => t.id === templateId);
      const shopId = getActiveShopId();
      
      if (!template) {
        toast.error('لم يتم العثور على القالب');
        return null;
      }
      
      if (!shopId) {
        console.error('No active shop ID found');
        toast.error('لم يتم العثور على متجر نشط');
        return null;
      }

      // Get shop currency and country from shopify-shop-info function
      const getShopCurrencyAndCountry = async (): Promise<{ currency?: string; country?: string }> => {
        try {
          const { data, error } = await supabase.functions.invoke('shopify-shop-info', {
            body: { shop: shopId }
          });
            
          if (error) {
            console.log('Error fetching shop info:', error);
            return {};
          }
          
          console.log('✅ Shop info fetched:', data);
          return {
            currency: data?.shop?.money_format?.replace(/[^A-Z]/g, '') || data?.shop?.currency,
            country: data?.shop?.country_code
          };
        } catch (error) {
          console.log('Could not fetch shop info, using default');
          return {};
        }
      };

      const { currency: shopCurrency, country: shopCountry } = await getShopCurrencyAndCountry();
      const defaultSettings = getDefaultCountryCurrencySettings(shopCurrency, shopCountry);

      // New form data
      const newFormId = uuidv4();
      const formData: FormData = {
        id: newFormId,
        title: template.title,
        description: template.description,
        data: template.data,
        isPublished: false,
        shop_id: shopId,
      };

      // Determine user authentication approach
      const { data: { session } } = await supabase.auth.getSession();
      
      // For Shopify stores without traditional auth, use default user ID
      let userIdForForm: string;
      let shopIdForForm: string | null = null;
      
      if (session?.user?.id) {
        // Traditional authentication
        userIdForForm = session.user.id;
        shopIdForForm = shopId;
      } else if (shopId) {
        // Shopify authentication - use default user
        userIdForForm = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
        shopIdForForm = shopId;
      } else {
        toast.error('لم يتم العثور على مصادقة صالحة');
        return null;
      }

      const { error } = await supabase
        .from('forms')
        .insert({
          id: newFormId,
          title: template.title,
          description: template.description,
          data: template.data as any,
          is_published: false,
          shop_id: shopIdForForm,
          user_id: userIdForForm,
          country: defaultSettings.country,
          currency: defaultSettings.currency,
          phone_prefix: defaultSettings.phonePrefix
        } as any);

      if (error) {
        console.error('Error saving form to database:', error);
        toast.error('خطأ في حفظ النموذج في قاعدة البيانات');
        return null;
      }

      setFormState(formData);
      toast.success(`تم إنشاء نموذج من قالب ${template.title}`);
      
      console.log(`✅ تم إنشاء النموذج بنجاح مع الإعدادات: البلد ${defaultSettings.country}, العملة ${defaultSettings.currency}`);
      await fetchForms();
      
      return formData;
    } catch (error) {
      console.error('Error creating form from template', error);
      toast.error('خطأ في إنشاء نموذج من قالب');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to create default form fields
  const createCompleteDefaultFormFields = (language: string, shopCurrency: string = 'USD'): FormField[] => {
    const defaultFields: FormField[] = [];
    
    // Add form title field
    defaultFields.push({
      type: 'form-title',
      id: uuidv4(),
      label: language === 'ar' ? 'نموذج جديد' : 'New Form',
      helpText: language === 'ar' ? 'نموذج جديد' : 'New Form',
      style: {
        color: '#000000',
        textAlign: language === 'ar' ? 'right' : 'left',
        fontWeight: 'bold',
        fontSize: '24px',
        descriptionColor: '#000000',
        descriptionFontSize: '14px',
        backgroundColor: 'transparent',
      }
    });
    
    // Add name field
    defaultFields.push({
      type: 'text',
      id: uuidv4(),
      label: language === 'ar' ? 'الاسم الكامل' : 'Full name',
      placeholder: language === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name',
      required: true,
      icon: 'user',
    });
    
    // Add phone field
    defaultFields.push({
      type: 'phone',
      id: uuidv4(),
      label: language === 'ar' ? 'رقم الهاتف' : 'Phone number',
      placeholder: language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number',
      required: true,
      icon: 'phone',
    });
    
    // Add address field
    defaultFields.push({
      type: 'textarea',
      id: uuidv4(),
      label: language === 'ar' ? 'العنوان' : 'Address',
      placeholder: language === 'ar' ? 'أدخل العنوان الكامل' : 'Enter full address',
      required: true,
    });
    
    // Add cart summary field (positioned before submit button)
    defaultFields.push({
      type: 'cart-summary',
      id: uuidv4(),
      label: language === 'ar' ? 'ملخص الطلب' : 'Order Summary',
      cartSummaryConfig: {
        showSubtotal: true,
        showDiscount: true,
        showShipping: true,
        showTotal: true,
        subtotalLabel: language === 'ar' ? 'المجموع الفرعي' : 'Subtotal',
        discountLabel: language === 'ar' ? 'الخصم' : 'Discount',
        shippingLabel: language === 'ar' ? 'الشحن' : 'Shipping',
        totalLabel: language === 'ar' ? 'المجموع الكلي' : 'Total',
        freeShippingText: language === 'ar' ? 'شحن مجاني' : 'Free shipping',
        direction: language === 'ar' ? 'rtl' : 'ltr',
        currency: shopCurrency // Use actual shop currency
      }
    });
    
    // Add submit button
    defaultFields.push({
      type: 'submit',
      id: uuidv4(),
      label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
      icon: 'shopping-cart',
      style: {
        backgroundColor: '#9b87f5',
        showIcon: true,
        iconPosition: 'right',
        color: '#ffffff',
        fontSize: '18px',
        animation: true,
        animationType: 'pulse',
      },
    });
    
    return defaultFields;
  };

  // Create a default form
  const createDefaultForm = async () => {
    try {
      if (isCreatingForm) {
        console.log('Already creating a form, preventing duplicate creation');
        return null;
      }
      
      setIsCreatingForm(true);
      setIsLoading(true);
      
      const shopId = getActiveShopId();
      
      if (!shopId) {
        console.error('No active shop ID found');
        toast.error('لم يتم العثور على متجر نشط');
        return null;
      }

      const newFormId = uuidv4();
      console.log('Creating new form with ID:', newFormId);
      
      // Get shop currency first using the existing function below
      const getShopCurrencyAndCountry = async (): Promise<{ currency?: string; country?: string }> => {
        try {
          const { data, error } = await supabase.functions.invoke('shopify-shop-info', {
            body: { shop: shopId }
          });
            
          if (error) {
            console.log('Error fetching shop info:', error);
            return {};
          }
          
          console.log('✅ Shop info fetched for new form:', data);
          return {
            currency: data?.shop?.money_format?.replace(/[^A-Z]/g, '') || data?.shop?.currency,
            country: data?.shop?.country_code
          };
        } catch (error) {
          console.log('Could not fetch shop info, using default');
          return {};
        }
      };

      const { currency: shopCurrency } = await getShopCurrencyAndCountry();
      console.log('🏪 Shop currency for new form:', shopCurrency);

      // تهيئة إعدادات العملة للمتجر لضمان عرض صحيح
      try {
        const { CurrencyService } = await import('@/lib/services/CurrencyService');
        CurrencyService.setShopContext(shopId, null);
        await CurrencyService.initialize();
        console.log('✅ Currency service initialized for template form');
      } catch (error) {
        console.log('⚠️ Could not initialize currency service in template:', error);
      }

      const currentLanguage = document.documentElement.lang || 'ar';
      const completeFields = createCompleteDefaultFormFields(currentLanguage, shopCurrency || 'USD');
      
      // Prepare the form data
      const formData: FormData = {
        id: newFormId,
        title: currentLanguage === 'ar' ? 'نموذج جديد' : 'New Form',
        description: currentLanguage === 'ar' ? 'نموذج جديد' : 'New Form',
        data: [{ 
          id: '1', 
          title: 'Main Step',
          fields: completeFields
        }],
        isPublished: false,
        shop_id: shopId,
      };
      
      // Insert the form into database using same logic as template creation
      const { data: { session } } = await supabase.auth.getSession();
      
      let userIdForForm: string;
      let shopIdForForm: string | null = null;
      
      if (session?.user?.id) {
        // Traditional authentication
        userIdForForm = session.user.id;
        shopIdForForm = shopId;
      } else if (shopId) {
        // Shopify authentication - use default user
        userIdForForm = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
        shopIdForForm = shopId;
      } else {
        toast.error('لم يتم العثور على مصادقة صالحة');
        return null;
      }

      // Use the already fetched shop currency and country
      const defaultSettings = getDefaultCountryCurrencySettings(shopCurrency);

      const { error } = await supabase
        .from('forms')
        .insert({
          id: newFormId,
          title: 'نموذج جديد',
          description: 'نموذج جديد',
          data: [{
            id: '1',
            title: 'Main Step',
            fields: completeFields
          }] as any,
          is_published: false,
          shop_id: shopIdForForm,
          user_id: userIdForForm,
          country: defaultSettings.country,
          currency: defaultSettings.currency,
          phone_prefix: defaultSettings.phonePrefix
        } as any);
      
      if (error) {
        console.error('Error saving form to database:', error);
        toast.error('خطأ في حفظ النموذج في قاعدة البيانات');
        return null;
      }

      setFormState(formData);
      toast.success('تم إنشاء نموذج جديد');
      
      // Refresh forms list immediately
      await fetchForms();
      
      return formData;
    } catch (error) {
      console.error('Error creating default form', error);
      toast.error('خطأ في إنشاء نموذج جديد');
      return null;
    } finally {
      setIsLoading(false);
      setIsCreatingForm(false);
    }
  };

  // Save form changes using the service
  const saveForm = async (formId: string, formData: Partial<FormData>) => {
    try {
      setIsLoading(true);
      const updatedForm = await formManagementService.saveForm(formId, formData);
      
      if (updatedForm) {
        // Update local state with the fresh data from database
        setForms(prevForms => 
          prevForms.map(form => 
            form.id === formId ? updatedForm : form
          )
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Publish or unpublish a form using the service
  const publishForm = async (formId: string, publish: boolean) => {
    try {
      setIsLoading(true);
      const updatedForm = await formManagementService.toggleFormPublication(formId, publish);
      
      if (updatedForm) {
        // Re-fetch all forms from database to ensure consistency
        await fetchForms();
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a form using the service
  const deleteForm = async (formId: string) => {
    try {
      setIsLoading(true);
      console.log('🗑️ Hook: Starting form deletion for ID:', formId);
      
      const success = await formManagementService.deleteForm(formId);
      
      if (success) {
        console.log('✅ Hook: Form deleted successfully from service');
        // إزالة النموذج من الحالة المحلية فوراً
        setForms(prevForms => {
          const updatedForms = prevForms.filter(form => form.id !== formId);
          console.log('🔄 Hook: Updated forms list, new count:', updatedForms.length);
          return updatedForms;
        });
        
        return true;
      }
      
      console.log('❌ Hook: Form deletion failed in service');
      return false;
    } catch (error) {
      console.error('❌ Hook: Error in deleteForm:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load a specific form by ID using the service
  const loadForm = async (formId: string | undefined) => {
    try {
      setIsLoading(true);
      
      if (!formId || formId === 'new') {
        return null;
      }
      
      const formData = await formManagementService.loadForm(formId);
      
      if (formData) {
        setFormState(formData);
        return formData;
      }
      
      return null;
    } catch (error) {
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    forms,
    isLoading,
    offlineMode,
    retryCount,
    fetchForms,
    createFormFromTemplate,
    createDefaultForm,
    saveForm,
    publishForm,
    deleteForm,
    loadForm
  };
};

// Update the template data to use id as string instead of number
export const formTemplates: FormTemplate[] = [
  {
    id: 1,
    title: 'Cash on Delivery Form',
    description: 'A simple form to collect customer information for cash on delivery orders.',
    primaryColor: '#9b87f5',
    data: [
      {
        id: '1', // Changed from number to string
        title: 'Customer Information',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Full Name',
            required: true,
            placeholder: 'Enter your full name'
          },
          {
            id: 'phone',
            type: 'phone',
            label: 'Phone Number',
            required: true,
            placeholder: 'Enter your phone number'
          },
          {
            id: 'address',
            type: 'textarea',
            label: 'Address',
            required: true,
            placeholder: 'Enter your full address'
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Contact Form',
    description: 'A basic contact form to collect customer inquiries.',
    primaryColor: '#6adbb8',
    data: [
      {
        id: '1', // Changed from number to string
        title: 'Contact Details',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Your Name',
            required: true,
            placeholder: 'Enter your name'
          },
          {
            id: 'email',
            type: 'text',
            label: 'Your Email',
            required: true,
            placeholder: 'Enter your email address'
          },
          {
            id: 'message',
            type: 'textarea',
            label: 'Message',
            required: true,
            placeholder: 'Enter your message'
          }
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'Event Registration Form',
    description: 'A form to register participants for an event.',
    primaryColor: '#f0b34c',
    data: [
      {
        id: '1', // Changed from number to string
        title: 'Personal Information',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Full Name',
            required: true,
            placeholder: 'Enter your full name'
          },
          {
            id: 'email',
            type: 'text',
            label: 'Email Address',
            required: true,
            placeholder: 'Enter your email address'
          },
          {
            id: 'phone',
            type: 'phone',
            label: 'Phone Number',
            required: false,
            placeholder: 'Enter your phone number'
          }
        ]
      },
      {
        id: '2', // Changed from number to string
        title: 'Event Details',
        fields: [
          {
            id: 'event_date',
            type: 'text',
            label: 'Event Date',
            required: true,
            placeholder: 'Enter the event date'
          },
          {
            id: 'interests',
            type: 'checkbox',
            label: 'Areas of Interest',
            required: false,
            options: [
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
              { value: 'option3', label: 'Option 3' },
              { value: 'option4', label: 'Option 4' }
            ]
          }
        ]
      }
    ]
  }
];
