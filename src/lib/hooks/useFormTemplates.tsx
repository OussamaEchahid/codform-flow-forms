import { useState, useEffect } from 'react';
import { useFormStore, FormStyle } from '@/hooks/useFormStore';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { FormField, FormStep } from '@/lib/form-utils';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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

// Helper function for retrying failed requests
const fetchWithRetry = async (fetchFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      console.warn(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        // Wait before retrying (with exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
};

export const useFormTemplates = () => {
  const { setFormState } = useFormStore();
  const { user, shop } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [forms, setForms] = useState<FormData[]>([]);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Get current active shop ID from localStorage if not available in context
  const getActiveShopId = () => {
    return shop || localStorage.getItem('shopify_store');
  };
  
  // Check if we have locally cached forms to use in offline mode
  useEffect(() => {
    const cachedForms = localStorage.getItem('cached_forms');
    if (cachedForms) {
      try {
        // Attempt to parse and use cached forms
        const parsedForms = JSON.parse(cachedForms);
        if (Array.isArray(parsedForms) && parsedForms.length > 0) {
          setForms(parsedForms);
        }
      } catch (e) {
        console.error('Error parsing cached forms:', e);
      }
    }
  }, []);

  // Fetch all forms with retry logic
  const fetchForms = async () => {
    try {
      setIsLoading(true);
      const shopId = getActiveShopId();
      
      if (!shopId) {
        console.error('No active shop ID found');
        toast.error('لم يتم العثور على متجر نشط');
        setIsLoading(false);
        return;
      }

      try {
        // Use fetchWithRetry to attempt the request multiple times
        const { data, error } = await fetchWithRetry(async () => {
          return await supabase
            .from('forms')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });
        });
        
        if (error) {
          console.error('Error fetching forms:', error);
          toast.error('خطأ في جلب النماذج، جاري المحاولة مجددًا...');
          
          // Increment retry count for UI feedback
          setRetryCount(prev => prev + 1);
          
          setIsLoading(false);
          return;
        }
        
        // Reset offline mode if successful
        if (offlineMode) {
          setOfflineMode(false);
          toast.success('تم استعادة الاتصال بالخادم');
        }
        
        // Transform data to match FormData interface
        const formattedData = data.map(form => ({
          ...form,
          isPublished: form.is_published
        }));
        
        // Cache forms for offline use
        localStorage.setItem('cached_forms', JSON.stringify(formattedData));
        
        setForms(formattedData);
        setRetryCount(0);
      } catch (error) {
        console.error('Failed to fetch forms after retries:', error);
        
        // Set offline mode
        setOfflineMode(true);
        
        // Check for cached forms
        const cachedForms = localStorage.getItem('cached_forms');
        if (cachedForms) {
          try {
            const parsedForms = JSON.parse(cachedForms);
            if (Array.isArray(parsedForms) && parsedForms.length > 0) {
              setForms(parsedForms);
              toast.warning('جاري استخدام النماذج المخزنة محليًا، قد لا تكون محدثة');
            }
          } catch (e) {
            console.error('Error parsing cached forms:', e);
          }
        } else {
          toast.error('تعذر الاتصال بالخادم وعدم وجود نماذج مخزنة محليًا');
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Exception in fetchForms:', error);
      toast.error('خطأ في جلب النماذج');
      setIsLoading(false);
    }
  };

  // Create a form from template
  const createFormFromTemplate = async (templateId: number) => {
    try {
      setIsLoading(true);
      const template = formTemplates.find(t => t.id === templateId);
      const shopId = getActiveShopId();
      
      if (!template) {
        toast.error('لم يتم العثور على القالب');
        setIsLoading(false);
        return null;
      }
      
      if (!shopId) {
        console.error('No active shop ID found');
        toast.error('لم يتم العثور على متجر نشط');
        setIsLoading(false);
        return null;
      }

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

      // Insert into Supabase with retry
      try {
        const { error } = await fetchWithRetry(async () => {
          return await supabase
            .from('forms')
            .insert({
              id: newFormId,
              title: template.title,
              description: template.description,
              data: template.data as any,
              is_published: false,
              shop_id: shopId,
              user_id: user?.id || 'anonymous'
            });
        });

        if (error) {
          console.error('Error saving form to database:', error);
          toast.error('خطأ في حفظ النموذج في قاعدة البيانات');
          setIsLoading(false);
          return null;
        }
      } catch (error) {
        console.error('Failed to save form after retries:', error);
        toast.error('فشل الاتصال بالخادم، سيتم حفظ النموذج محليًا');
        
        // Store in local forms even if server sync fails
        const localForms = [...forms, formData];
        setForms(localForms);
        localStorage.setItem('cached_forms', JSON.stringify(localForms));
      }

      setFormState(formData);
      toast.success(`تم إنشاء نموذج من قالب ${template.title}`);
      
      // Refresh forms list
      fetchForms();
      
      setIsLoading(false);
      return formData;
    } catch (error) {
      console.error('Error creating form from template', error);
      toast.error('خطأ في إنشاء نموذج من قالب');
      setIsLoading(false);
      return null;
    }
  };

  // Helper function to create default form fields with all required fields
  const createCompleteDefaultFormFields = (language = 'ar'): FormField[] => {
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
    
    // Add submit button
    defaultFields.push({
      type: 'submit',
      id: uuidv4(),
      label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
      style: {
        backgroundColor: '#9b87f5',
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
      // منع الإنشاءات المتكررة
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
        setIsLoading(false);
        setIsCreatingForm(false);
        return null;
      }

      // Create a UUID immediately for the new form instead of using 'new'
      const newFormId = uuidv4();
      console.log('Creating new form with ID:', newFormId);
      
      // Get the current UI language
      const currentLanguage = document.documentElement.lang || 'ar';
      
      // Create complete form fields with all required fields
      const completeFields = createCompleteDefaultFormFields(currentLanguage);
      
      // Prepare the form data with all required fields
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
      
      // Insert the complete form with all required fields - with retry
      try {
        const { error } = await fetchWithRetry(async () => {
          return await supabase
            .from('forms')
            .insert({
              id: newFormId,
              title: formData.title,
              description: formData.description,
              data: formData.data as any,
              is_published: false,
              shop_id: shopId,
              user_id: user?.id || 'anonymous'
            });
        });
        
        if (error) {
          console.error('Error saving form to database:', error);
          toast.error('خطأ في حفظ النموذج في قاعدة البيانات');
          setIsLoading(false);
          setIsCreatingForm(false);
          return null;
        }
        
        // Reset offline mode if we succeed
        if (offlineMode) {
          setOfflineMode(false);
          toast.success('تم استعادة الاتصال بالخادم');
        }
      } catch (error) {
        console.error('Failed to save form after retries:', error);
        toast.warning('فشل الاتصال بالخادم، سيتم حفظ النموذج محليًا');
        setOfflineMode(true);
        
        // Store in local forms even if server sync fails
        const localForms = [...forms, formData];
        setForms(localForms);
        localStorage.setItem('cached_forms', JSON.stringify(localForms));
      }

      // Update form state and move to editing immediately
      setFormState(formData);
      toast.success('تم إنشاء نموذج جديد');
      
      // Refresh forms list but don't wait for it
      setTimeout(() => {
        fetchForms();
      }, 100);
      
      setIsLoading(false);
      setIsCreatingForm(false);
      return formData;
    } catch (error) {
      console.error('Error creating default form', error);
      toast.error('خطأ في إنشاء نموذج جديد');
      setIsLoading(false);
      setIsCreatingForm(false);
      return null;
    }
  };

  // Save form changes with retry logic
  const saveForm = async (formId: string, formData: Partial<FormData>) => {
    try {
      setIsLoading(true);
      
      // Convert isPublished to is_published for database
      const dbData: any = { ...formData };
      if (dbData.isPublished !== undefined) {
        dbData.is_published = dbData.isPublished;
        delete dbData.isPublished;
      }
      
      // Update form in Supabase with retry
      try {
        const { error } = await fetchWithRetry(async () => {
          return await supabase
            .from('forms')
            .update(dbData)
            .eq('id', formId);
        });
        
        if (error) {
          console.error('Error updating form:', error);
          toast.error('خطأ في تحديث النموذج');
          setIsLoading(false);
          return false;
        }
        
        // Reset offline mode if we succeed
        if (offlineMode) {
          setOfflineMode(false);
          toast.success('تم استعادة الاتصال بالخادم');
        }
        
        // Update local state if forms list is loaded
        if (forms.length > 0) {
          const updatedForms = forms.map(form => 
            form.id === formId ? { ...form, ...formData } : form
          );
          setForms(updatedForms);
          
          // Update local cache
          localStorage.setItem('cached_forms', JSON.stringify(updatedForms));
        }
      } catch (error) {
        console.error('Failed to save form after retries:', error);
        toast.warning('فشل الاتصال بالخادم، تم حفظ التغييرات محليًا فقط');
        
        // Update local state even if server sync fails
        if (forms.length > 0) {
          const updatedForms = forms.map(form => 
            form.id === formId ? { ...form, ...formData } : form
          );
          setForms(updatedForms);
          
          // Update local cache
          localStorage.setItem('cached_forms', JSON.stringify(updatedForms));
        }
        
        // Set offline mode
        setOfflineMode(true);
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error saving form', error);
      toast.error('خطأ في حفظ النموذج');
      setIsLoading(false);
      return false;
    }
  };

  // Publish or unpublish a form with retry logic
  const publishForm = async (formId: string, publish: boolean) => {
    try {
      setIsLoading(true);
      
      // Update form in Supabase with retry
      try {
        const { error } = await fetchWithRetry(async () => {
          return await supabase
            .from('forms')
            .update({ is_published: publish })
            .eq('id', formId);
        });
        
        if (error) {
          console.error('Error publishing form:', error);
          toast.error(publish ? 'خطأ في نشر النموذج' : 'خطأ في إلغاء نشر النموذج');
          setIsLoading(false);
          return false;
        }
        
        // Update local state immediately
        setForms(prevForms => {
          const updatedForms = prevForms.map(form => 
            form.id === formId ? { ...form, isPublished: publish, is_published: publish } : form
          );
          // Update local cache immediately
          localStorage.setItem('cached_forms', JSON.stringify(updatedForms));
          return updatedForms;
        });
        
        toast.success(publish ? 'تم نشر النموذج بنجاح' : 'تم إلغاء نشر النموذج بنجاح');
        
        // Reset offline mode if we succeed
        if (offlineMode) {
          setOfflineMode(false);
        }
      } catch (error) {
        console.error('Failed to publish form after retries:', error);
        toast.warning('فشل الاتصال بالخادم، تم تحديث الحالة محليًا فقط');
        
        // Update local state even if server sync fails
        setForms(prevForms => {
          const updatedForms = prevForms.map(form => 
            form.id === formId ? { ...form, isPublished: publish, is_published: publish } : form
          );
          localStorage.setItem('cached_forms', JSON.stringify(updatedForms));
          return updatedForms;
        });
        
        // Set offline mode
        setOfflineMode(true);
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error publishing form', error);
      toast.error('خطأ في تغيير حالة نشر النموذج');
      setIsLoading(false);
      return false;
    }
  };

  // Delete a form with retry logic
  const deleteForm = async (formId: string) => {
    try {
      console.log('🗑️ بدء عملية حذف النموذج:', formId);
      setIsLoading(true);
      
      // Step 1: Delete form from Supabase first
      console.log('🔄 محاولة حذف النموذج من قاعدة البيانات...');
      const { error, data } = await fetchWithRetry(async () => {
        return await supabase
          .from('forms')
          .delete()
          .eq('id', formId);
      });
      
      console.log('📊 نتيجة الحذف:', { error, data });
      
      if (error) {
        console.error('❌ خطأ في حذف النموذج:', error);
        toast.error('خطأ في حذف النموذج من قاعدة البيانات');
        setIsLoading(false);
        return false;
      }
      
      console.log('✅ تم حذف النموذج بنجاح من قاعدة البيانات');
      
      // Step 2: Remove product associations (cleanup)
      try {
        const { error: assocError } = await fetchWithRetry(async () => {
          return await supabase
            .from('shopify_product_settings')
            .delete()
            .eq('form_id', formId);
        });
        
        if (assocError) {
          console.warn('Error removing product associations:', assocError);
          // Form is already deleted, this is just cleanup
        }
      } catch (error) {
        console.warn('Failed to remove product associations:', error);
        // Form is already deleted, this is just cleanup
      }
      
      // Step 3: Update local state (this was the issue!)
      console.log('🔄 تحديث الواجهة المحلية...');
      setForms(prevForms => {
        const updatedForms = prevForms.filter(form => form.id !== formId);
        console.log('📝 النماذج بعد الحذف:', updatedForms.length);
        // Update local cache immediately
        localStorage.setItem('cached_forms', JSON.stringify(updatedForms));
        return updatedForms;
      });
      
      // Reset offline mode if we succeed
      if (offlineMode) {
        setOfflineMode(false);
        toast.success('تم استعادة الاتصال بالخادم');
      }
      
      toast.success('تم حذف النموذج بنجاح');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error deleting form', error);
      toast.error('خطأ في حذف النموذج');
      setIsLoading(false);
      return false;
    }
  };
  
  // Load a specific form by ID with retry logic
  const loadForm = async (formId: string | undefined) => {
    try {
      setIsLoading(true);
      
      // If formId is undefined, return null - do NOT create a new form here
      if (!formId) {
        console.log('No form ID provided');
        setIsLoading(false);
        return null;
      }
      
      // If formId is 'new', redirect to the proper form creation flow
      if (formId === 'new') {
        console.log('Form ID is "new" - this should be handled by the UI, not here');
        setIsLoading(false);
        return null;
      }
      
      // Check local cache first
      const cachedForms = localStorage.getItem('cached_forms');
      if (cachedForms) {
        try {
          const parsedForms = JSON.parse(cachedForms);
          if (Array.isArray(parsedForms)) {
            const cachedForm = parsedForms.find(form => form.id === formId);
            if (cachedForm) {
              console.log('Found form in local cache:', formId);
              // If we're in offline mode, use the cached form directly
              if (offlineMode) {
                setFormState(cachedForm);
                setIsLoading(false);
                return cachedForm;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing cached forms:', e);
        }
      }
      
      // Validate UUID format before querying
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(formId)) {
        console.error(`Invalid UUID format: "${formId}"`);
        toast.error('معرف النموذج غير صالح');
        setIsLoading(false);
        return null;
      }
      
      // Fetch form from Supabase with retry
      try {
        const { data, error } = await fetchWithRetry(async () => {
          return await supabase
            .from('forms')
            .select('*')
            .eq('id', formId)
            .single();
        });
        
        if (error) {
          console.error('Error loading form:', error);
          toast.error('خطأ في تحميل النموذج');
          setIsLoading(false);
          return null;
        }
        
        if (!data) {
          toast.error('النموذج غير موجود');
          setIsLoading(false);
          return null;
        }
        
        // Format data for form state
        const formData: FormData = {
          ...data,
          isPublished: data.is_published
        };
        
        // Update form cache with this form
        let cachedFormsArray = [];
        try {
          const cached = localStorage.getItem('cached_forms');
          if (cached) {
            cachedFormsArray = JSON.parse(cached);
            if (!Array.isArray(cachedFormsArray)) cachedFormsArray = [];
          }
        } catch (e) {
          console.error('Error parsing cached forms:', e);
          cachedFormsArray = [];
        }
        
        // Add or update this form in the cache
        const existingIndex = cachedFormsArray.findIndex(form => form.id === formId);
        if (existingIndex >= 0) {
          cachedFormsArray[existingIndex] = formData;
        } else {
          cachedFormsArray.push(formData);
        }
        
        localStorage.setItem('cached_forms', JSON.stringify(cachedFormsArray));
        
        // Update form state
        setFormState(formData);
        
        // Reset offline mode if we succeed
        if (offlineMode) {
          setOfflineMode(false);
          toast.success('تم استعادة الاتصال بالخادم');
        }
        
        setIsLoading(false);
        return formData;
      } catch (error) {
        console.error('Failed to load form after retries:', error);
        
        // Try to load from cache instead
        const cachedForms = localStorage.getItem('cached_forms');
        if (cachedForms) {
          try {
            const parsedForms = JSON.parse(cachedForms);
            if (Array.isArray(parsedForms)) {
              const cachedForm = parsedForms.find(form => form.id === formId);
              if (cachedForm) {
                toast.warning('فشل الاتصال بالخادم، جاري استخدام النسخة المحلية من النموذج');
                setFormState(cachedForm);
                
                // Set offline mode
                setOfflineMode(true);
                
                setIsLoading(false);
                return cachedForm;
              }
            }
          } catch (e) {
            console.error('Error parsing cached forms:', e);
          }
        }
        
        toast.error('تعذر تحميل النموذج، فضلًا تأكد من اتصالك بالإنترنت');
        setIsLoading(false);
        return null;
      }
    } catch (error) {
      console.error('Error loading form', error);
      toast.error('خطأ في تحميل النموذج');
      setIsLoading(false);
      return null;
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
