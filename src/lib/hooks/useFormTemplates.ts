
import { useState, useEffect } from 'react';
import { useFormStore } from '@/hooks/useFormStore';
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
  submitButtonText?: string;
  // Add style properties
  primaryColor?: string;
  borderRadius?: string;
  fontSize?: string;
  buttonStyle?: string;
  // Add language support
  formLanguage?: 'ar' | 'en' | 'fr';
  rtl?: boolean;
  translations?: {
    ar?: {
      title?: string;
      description?: string;
      submitButtonText?: string;
      fields?: Record<string, {
        label?: string;
        placeholder?: string;
        options?: string[];
      }>;
    };
    en?: {
      title?: string;
      description?: string;
      submitButtonText?: string;
      fields?: Record<string, {
        label?: string;
        placeholder?: string;
        options?: string[];
      }>;
    };
    fr?: {
      title?: string;
      description?: string;
      submitButtonText?: string;
      fields?: Record<string, {
        label?: string;
        placeholder?: string;
        options?: string[];
      }>;
    };
  };
}

export interface FormTemplate {
  id: number;
  title: string;
  description: string;
  primaryColor: string;
  data: FormStep[];
}

export const useFormTemplates = () => {
  const { setFormState, resetFormState } = useFormStore();
  const { user, shop } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [forms, setForms] = useState<FormData[]>([]);

  // Get current active shop ID from localStorage if not available in context
  const getActiveShopId = () => {
    return shop || localStorage.getItem('shopify_store');
  };

  // Fetch all forms
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
      
      console.log("Fetching forms for shop ID:", shopId);
      
      // Fetch forms from Supabase where shop_id matches
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching forms:', error);
        toast.error('خطأ في جلب النماذج');
        setIsLoading(false);
        return;
      }
      
      // Transform data to match FormData interface
      const formattedData = data.map(form => ({
        ...form,
        isPublished: form.is_published
      }));
      
      // Remove duplicates based on form ID (keep the latest version)
      const uniqueForms = Array.from(
        new Map(formattedData.map(item => [item.id, item])).values()
      );
      
      console.log(`Fetched ${uniqueForms.length} unique forms`);
      setForms(uniqueForms);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching forms', error);
      toast.error('خطأ في جلب النماذج');
      setIsLoading(false);
    }
  };

  // Create a form from template
  const createFormFromTemplate = async (templateId: number) => {
    try {
      setIsLoading(true);
      resetFormState(); // Reset form state before creating a new one
      
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

      console.log("Creating form from template:", template.title);
      
      // Initialize translations with proper structure
      const defaultTranslations = {
        ar: {
          title: 'نموذج جديد',
          description: template.description,
          submitButtonText: 'إرسال الطلب',
          fields: {}
        },
        en: {
          title: 'New Form',
          description: template.description,
          submitButtonText: 'Submit',
          fields: {}
        },
        fr: {
          title: 'Nouveau Formulaire',
          description: template.description,
          submitButtonText: 'Soumettre',
          fields: {}
        }
      };

      // Add field translations for all fields in template
      template.data.forEach(step => {
        step.fields.forEach(field => {
          // Init fields objects if they don't exist
          defaultTranslations.ar.fields = defaultTranslations.ar.fields || {};
          defaultTranslations.en.fields = defaultTranslations.en.fields || {};
          defaultTranslations.fr.fields = defaultTranslations.fr.fields || {};
          
          defaultTranslations.ar.fields[field.id] = {
            label: field.label,
            placeholder: field.placeholder,
            options: Array.isArray(field.options) ? [...field.options] : undefined
          };
          
          defaultTranslations.en.fields[field.id] = {
            label: field.label,
            placeholder: field.placeholder,
            options: Array.isArray(field.options) ? [...field.options] : undefined
          };
          
          defaultTranslations.fr.fields[field.id] = {
            label: field.label,
            placeholder: field.placeholder,
            options: Array.isArray(field.options) ? [...field.options] : undefined
          };
        });
      });

      // New form data with translations
      const newFormId = uuidv4();
      const formData: FormData = {
        id: newFormId,
        title: template.title,
        description: template.description,
        data: template.data,
        isPublished: false,
        shop_id: shopId,
        primaryColor: template.primaryColor,
        formLanguage: 'ar',
        rtl: true,
        translations: defaultTranslations
      };

      console.log("Creating form with data:", formData);
      
      // Insert into Supabase
      const { error } = await supabase
        .from('forms')
        .insert({
          id: newFormId,
          title: template.title,
          description: template.description,
          data: template.data,
          is_published: false,
          shop_id: shopId,
          user_id: user?.id,
          primaryColor: template.primaryColor,
          formLanguage: 'ar',
          rtl: true,
          translations: defaultTranslations
        });

      if (error) {
        console.error('Error saving form to database:', error);
        toast.error('خطأ في حفظ النموذج في قاعدة البيانات');
        setIsLoading(false);
        return null;
      }
      
      console.log("Form created successfully:", newFormId);
      
      // First update the form state
      setFormState(formData);
      
      // Then refresh the forms list
      await fetchForms();
      
      setIsLoading(false);
      return formData;
    } catch (error) {
      console.error('Error creating form from template', error);
      toast.error('خطأ في إنشاء نموذج من قالب');
      setIsLoading(false);
      return null;
    }
  };

  // Create a default form
  const createDefaultForm = async () => {
    try {
      setIsLoading(true);
      resetFormState(); // Reset form state before creating a new one
      
      const defaultTemplate = formTemplates[0]; // Use first template as default
      const shopId = getActiveShopId();
      
      if (!shopId) {
        console.error('No active shop ID found');
        toast.error('لم يتم العثور على متجر نشط');
        setIsLoading(false);
        return null;
      }

      console.log("Creating default form for shop:", shopId);
      
      // Initialize translations with proper structure
      const defaultTranslations = {
        ar: {
          title: 'نموذج جديد',
          description: 'نموذج جديد',
          submitButtonText: 'إرسال الطلب',
          fields: {}
        },
        en: {
          title: 'New Form',
          description: 'New Form',
          submitButtonText: 'Submit',
          fields: {}
        },
        fr: {
          title: 'Nouveau Formulaire',
          description: 'Nouveau Formulaire',
          submitButtonText: 'Soumettre',
          fields: {}
        }
      };

      // Add translations for each field in the default template
      defaultTemplate.data.forEach(step => {
        step.fields.forEach(field => {
          // Init fields objects if they don't exist
          defaultTranslations.ar.fields = defaultTranslations.ar.fields || {};
          defaultTranslations.en.fields = defaultTranslations.en.fields || {};
          defaultTranslations.fr.fields = defaultTranslations.fr.fields || {};
          
          defaultTranslations.ar.fields[field.id] = {
            label: field.label,
            placeholder: field.placeholder,
            options: Array.isArray(field.options) ? [...field.options] : undefined
          };
          
          defaultTranslations.en.fields[field.id] = {
            label: field.label,
            placeholder: field.placeholder,
            options: Array.isArray(field.options) ? [...field.options] : undefined
          };
          
          defaultTranslations.fr.fields[field.id] = {
            label: field.label,
            placeholder: field.placeholder,
            options: Array.isArray(field.options) ? [...field.options] : undefined
          };
        });
      });

      const newFormId = uuidv4();
      const formData: FormData = {
        id: newFormId,
        title: 'نموذج جديد',
        description: 'نموذج جديد',
        data: defaultTemplate.data,
        isPublished: false,
        shop_id: shopId,
        primaryColor: '#9b87f5',
        borderRadius: '0.5rem',
        fontSize: '1rem',
        buttonStyle: 'rounded',
        formLanguage: 'ar',
        rtl: true,
        translations: defaultTranslations
      };

      console.log("Creating form with data:", formData);
      
      // Insert into Supabase
      const { error } = await supabase
        .from('forms')
        .insert({
          id: newFormId,
          title: 'نموذج جديد',
          description: 'نموذج جديد',
          data: defaultTemplate.data,
          is_published: false,
          shop_id: shopId,
          user_id: user?.id,
          primaryColor: '#9b87f5',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          buttonStyle: 'rounded',
          formLanguage: 'ar',
          rtl: true,
          translations: defaultTranslations
        });
        
      if (error) {
        console.error('Error saving form to database:', error);
        toast.error('خطأ في حفظ النموذج في قاعدة البيانات');
        setIsLoading(false);
        return null;
      }

      console.log("Form created successfully:", newFormId);
      
      // First update the form state
      setFormState(formData);
      
      // Then refresh the forms list
      await fetchForms();
      
      setIsLoading(false);
      return formData;
    } catch (error) {
      console.error('Error creating default form', error);
      toast.error('خطأ في إنشاء نموذج جديد');
      setIsLoading(false);
      return null;
    }
  };

  // Save form changes
  const saveForm = async (formId: string, formData: Partial<FormData>) => {
    try {
      setIsLoading(true);
      
      // Convert isPublished to is_published for database
      const dbData: any = { ...formData };
      if (dbData.isPublished !== undefined) {
        dbData.is_published = dbData.isPublished;
        delete dbData.isPublished;
      }
      
      console.log('Saving form data for ID:', formId);
      
      // Update form in Supabase
      const { error } = await supabase
        .from('forms')
        .update(dbData)
        .eq('id', formId);
      
      if (error) {
        console.error('Error updating form:', error);
        toast.error('خطأ في تحديث النموذج');
        setIsLoading(false);
        return false;
      }
      
      // Update local state if forms list is loaded
      if (forms.length > 0) {
        const updatedForms = forms.map(form => 
          form.id === formId ? { ...form, ...formData } : form
        );
        setForms(updatedForms);
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

  // Publish or unpublish a form
  const publishForm = async (formId: string, publish: boolean) => {
    try {
      setIsLoading(true);
      
      // Update form in Supabase
      const { error } = await supabase
        .from('forms')
        .update({ is_published: publish })
        .eq('id', formId);
      
      if (error) {
        console.error('Error publishing form:', error);
        toast.error(publish ? 'خطأ في نشر النموذج' : 'خطأ في إلغاء نشر النموذج');
        setIsLoading(false);
        return false;
      }
      
      // Update local state
      setForms(forms.map(form => 
        form.id === formId ? { ...form, isPublished: publish, is_published: publish } : form
      ));
      
      toast.success(publish ? 'تم نشر النموذج بنجاح' : 'تم إلغاء نشر النموذج');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error publishing form', error);
      toast.error('خطأ في تغيير حالة نشر النموذج');
      setIsLoading(false);
      return false;
    }
  };

  // Delete a form
  const deleteForm = async (formId: string) => {
    try {
      setIsLoading(true);
      
      // Delete form from Supabase
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);
      
      if (error) {
        console.error('Error deleting form:', error);
        toast.error('خطأ في حذف النموذج');
        setIsLoading(false);
        return false;
      }
      
      // Update local state
      setForms(forms.filter(form => form.id !== formId));
      
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
  
  // Load a specific form by ID
  const loadForm = async (formId: string) => {
    try {
      setIsLoading(true);
      
      console.log("Loading form with ID:", formId);
      
      // Fetch form from Supabase
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
      
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
      
      // Ensure translations object exists with proper structure
      const ensuredTranslations = data.translations || {
        ar: { 
          title: data.title, 
          description: data.description || '', 
          submitButtonText: data.submitButtonText || 'إرسال الطلب', 
          fields: {} 
        },
        en: { 
          title: data.title, 
          description: data.description || '', 
          submitButtonText: 'Submit', 
          fields: {} 
        },
        fr: { 
          title: data.title, 
          description: data.description || '', 
          submitButtonText: 'Soumettre', 
          fields: {} 
        }
      };
      
      // Ensure fields exists for each language
      if (!ensuredTranslations.ar.fields) ensuredTranslations.ar.fields = {};
      if (!ensuredTranslations.en.fields) ensuredTranslations.en.fields = {};
      if (!ensuredTranslations.fr.fields) ensuredTranslations.fr.fields = {};
      
      // Format data for form state
      const formData: FormData = {
        ...data,
        isPublished: data.is_published,
        translations: ensuredTranslations
      };
      
      console.log('Loaded form with translations:', formData);
      
      // Update form state
      setFormState(formData);
      
      setIsLoading(false);
      return formData;
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
            options: ['Technology', 'Marketing', 'Design', 'Business']
          }
        ]
      }
    ]
  }
];
