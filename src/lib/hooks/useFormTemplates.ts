
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
  // Style properties
  primaryColor?: string;
  borderRadius?: string;
  fontSize?: string;
  buttonStyle?: string;
  formStyle?: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
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
  const { formState, setFormState, resetFormState, markAsSaved, markAsDirty } = useFormStore();
  const { user, shop } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [forms, setForms] = useState<FormData[]>([]);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get current active shop ID from localStorage if not available in context
  const getActiveShopId = () => {
    return shop || localStorage.getItem('shopify_store');
  };

  // Fetch all forms
  const fetchForms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const shopId = getActiveShopId();
      
      if (!shopId) {
        console.error('No active shop ID found');
        toast.error('لم يتم العثور على متجر نشط');
        setIsLoading(false);
        return;
      }
      
      // Fetch forms from Supabase where shop_id matches
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching forms:', error);
        toast.error('خطأ في جلب النماذج');
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      console.log('Forms fetched successfully:', data);
      
      // Transform data to match FormData interface
      const formattedData = data.map(form => ({
        ...form,
        isPublished: form.is_published,
        // Ensure form styling is properly structured
        formStyle: {
          primaryColor: form.primaryColor || '#9b87f5',
          borderRadius: form.borderRadius || '0.5rem',
          fontSize: form.fontSize || '1rem',
          buttonStyle: form.buttonStyle || 'rounded',
        }
      }));
      
      // Remove any duplicates by ID
      const uniqueForms = formattedData.reduce((acc: FormData[], current) => {
        const exists = acc.find(form => form.id === current.id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setForms(uniqueForms);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching forms', error);
      toast.error('خطأ في جلب النماذج');
      setError(error.message || 'Unknown error');
      setIsLoading(false);
    }
  };

  // Create a form from template
  const createFormFromTemplate = async (templateId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      resetFormState(); // Clear any previous form state
      
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

      // New form data with properly structured style properties
      const newFormId = uuidv4();
      const formStyle = {
        primaryColor: template.primaryColor || '#9b87f5',
        borderRadius: '0.5rem',
        fontSize: '1rem',
        buttonStyle: 'rounded',
      };
      
      const formData: FormData = {
        id: newFormId,
        title: template.title,
        description: template.description,
        data: template.data,
        isPublished: false,
        shop_id: shopId,
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle,
        formStyle: formStyle,
      };

      // Insert into Supabase - include style properties in the data field also
      const dataWithStyle = template.data.map(step => ({
        ...step,
        formStyle,  // Add style to each step for future compatibility
      }));

      const { error } = await supabase
        .from('forms')
        .insert({
          id: newFormId,
          title: template.title,
          description: template.description,
          data: dataWithStyle,
          is_published: false,
          shop_id: shopId,
          user_id: user?.id,
          primaryColor: formStyle.primaryColor,
          borderRadius: formStyle.borderRadius,
          fontSize: formStyle.fontSize,
          buttonStyle: formStyle.buttonStyle
        });

      if (error) {
        console.error('Error saving form to database:', error);
        toast.error('خطأ في حفظ النموذج في قاعدة البيانات');
        setError(error.message);
        setIsLoading(false);
        return null;
      }

      setFormState(formData);
      toast.success(`تم إنشاء نموذج من قالب ${template.title}`);
      
      // Refresh forms list
      fetchForms();
      
      setIsLoading(false);
      return formData;
    } catch (error: any) {
      console.error('Error creating form from template', error);
      toast.error('خطأ في إنشاء نموذج من قالب');
      setError(error.message || 'Unknown error');
      setIsLoading(false);
      return null;
    }
  };

  // Create a default form
  const createDefaultForm = async () => {
    try {
      setIsLoading(true);
      setError(null);
      resetFormState(); // Clear any previous form state
      
      const defaultTemplate = formTemplates[0]; // Use first template as default
      const shopId = getActiveShopId();
      
      if (!shopId) {
        console.error('No active shop ID found');
        toast.error('لم يتم العثور على متجر نشط');
        setIsLoading(false);
        return null;
      }

      const newFormId = uuidv4();
      const formStyle = {
        primaryColor: defaultTemplate.primaryColor || '#9b87f5',
        borderRadius: '0.5rem',
        fontSize: '1rem',
        buttonStyle: 'rounded',
      };

      const formData: FormData = {
        id: newFormId,
        title: 'نموذج جديد',
        description: 'نموذج جديد',
        data: defaultTemplate.data,
        isPublished: false,
        shop_id: shopId,
        formStyle: formStyle,
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle,
      };

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
          primaryColor: formStyle.primaryColor,
          borderRadius: formStyle.borderRadius,
          fontSize: formStyle.fontSize,
          buttonStyle: formStyle.buttonStyle
        });
        
      if (error) {
        console.error('Error saving form to database:', error);
        toast.error('خطأ في حفظ النموذج في قاعدة البيانات');
        setError(error.message);
        setIsLoading(false);
        return null;
      }

      setFormState(formData);
      toast.success('تم إنشاء نموذج جديد');
      
      // Refresh forms list
      fetchForms();
      
      setIsLoading(false);
      return formData;
    } catch (error: any) {
      console.error('Error creating default form', error);
      toast.error('خطأ في إنشاء نموذج جديد');
      setError(error.message || 'Unknown error');
      setIsLoading(false);
      return null;
    }
  };

  // Save form changes
  const saveForm = async (formId: string, formData: Partial<FormData>) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting to save form:', formId);
      console.log('Form data to save:', formData);
      
      // Convert isPublished to is_published for database
      const dbData: any = { ...formData };
      if (dbData.isPublished !== undefined) {
        dbData.is_published = dbData.isPublished;
        delete dbData.isPublished;
      }
      
      // Handle style properties correctly
      // Extract style properties from formStyle if available
      if (formData.formStyle) {
        dbData.primaryColor = formData.formStyle.primaryColor || formData.primaryColor;
        dbData.borderRadius = formData.formStyle.borderRadius || formData.borderRadius;
        dbData.fontSize = formData.formStyle.fontSize || formData.fontSize;
        dbData.buttonStyle = formData.formStyle.buttonStyle || formData.buttonStyle;
      }

      // Ensure data field is properly structured with style
      if (dbData.data && Array.isArray(dbData.data)) {
        // Include form style data in each step
        dbData.data = dbData.data.map((step: any) => {
          // Add formStyle to each step
          const stepWithStyle = {
            ...step,
            formStyle: {
              primaryColor: dbData.primaryColor || formData.primaryColor,
              borderRadius: dbData.borderRadius || formData.borderRadius,
              fontSize: dbData.fontSize || formData.fontSize,
              buttonStyle: dbData.buttonStyle || formData.buttonStyle,
            },
          };

          // Make sure all fields have proper IDs 
          if (step.fields && Array.isArray(step.fields)) {
            stepWithStyle.fields = step.fields.map((field: any) => {
              if (!field.id) {
                field.id = `${field.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
              }
              return field;
            });
          }
          
          return stepWithStyle;
        });
      }
      
      // Update form in Supabase with updated_at field
      dbData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('forms')
        .update(dbData)
        .eq('id', formId)
        .select();
      
      if (error) {
        console.error('Error updating form:', error);
        toast.error('خطأ في تحديث النموذج');
        setError(error.message);
        setIsLoading(false);
        return false;
      }
      
      console.log("Form saved successfully to database:", data);
      setLastSavedId(formId);
      
      // Update local state if forms list is loaded
      if (forms.length > 0) {
        setForms(forms.map(form => 
          form.id === formId ? { ...form, ...formData } : form
        ));
      }
      
      // Mark as saved in the form store
      markAsSaved();
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error saving form', error);
      toast.error('خطأ في حفظ النموذج');
      setError(error.message || 'Unknown error');
      setIsLoading(false);
      return false;
    }
  };

  // Publish or unpublish a form
  const publishForm = async (formId: string, publish: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Update form in Supabase
      const { error } = await supabase
        .from('forms')
        .update({ 
          is_published: publish,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId);
      
      if (error) {
        console.error('Error publishing form:', error);
        toast.error(publish ? 'خطأ في نشر النموذج' : 'خطأ في إلغاء نشر النموذج');
        setError(error.message);
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
    } catch (error: any) {
      console.error('Error publishing form', error);
      toast.error('خطأ في تغيير حالة نشر النموذج');
      setError(error.message || 'Unknown error');
      setIsLoading(false);
      return false;
    }
  };

  // Delete a form
  const deleteForm = async (formId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Delete form from Supabase
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);
      
      if (error) {
        console.error('Error deleting form:', error);
        toast.error('خطأ في حذف النموذج');
        setError(error.message);
        setIsLoading(false);
        return false;
      }
      
      // Update local state
      setForms(forms.filter(form => form.id !== formId));
      
      toast.success('تم حذف النموذج بنجاح');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error deleting form', error);
      toast.error('خطأ في حذف النموذج');
      setError(error.message || 'Unknown error');
      setIsLoading(false);
      return false;
    }
  };
  
  // Load a specific form by ID
  const loadForm = async (formId: string) => {
    try {
      console.log('Loading form:', formId);
      setIsLoading(true);
      setError(null);
      resetFormState(); // Clear previous form state
      
      // Fetch form from Supabase
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
      
      if (error) {
        console.error('Error loading form:', error);
        toast.error('خطأ في تحميل النموذج');
        setError(error.message);
        setIsLoading(false);
        return null;
      }
      
      if (!data) {
        toast.error('النموذج غير موجود');
        setIsLoading(false);
        return null;
      }
      
      console.log('Form loaded from database:', data);
      
      // Format data for form state with proper style structure
      const formStyle = {
        primaryColor: data.primaryColor || '#9b87f5',
        borderRadius: data.borderRadius || '0.5rem',
        fontSize: data.fontSize || '1rem',
        buttonStyle: data.buttonStyle || 'rounded',
      };
      
      const formData: FormData = {
        ...data,
        isPublished: data.is_published,
        formStyle: formStyle,
      };
      
      // Update form state
      setFormState({
        ...formData,
        isDirty: false
      });
      
      setIsLoading(false);
      return formData;
    } catch (error: any) {
      console.error('Error loading form', error);
      toast.error('خطأ في تحميل النموذج');
      setError(error.message || 'Unknown error');
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
    loadForm,
    lastSavedId,
    error
  };
};

// Template data definitions
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
