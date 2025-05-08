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

      // New form data
      const newFormId = uuidv4();
      const formData: FormData = {
        id: newFormId,
        title: template.title,
        description: template.description,
        data: template.data,
        isPublished: false,
        shop_id: shopId,
        primaryColor: template.primaryColor,
      };

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
          primaryColor: template.primaryColor
        });

      if (error) {
        console.error('Error saving form to database:', error);
        toast.error('خطأ في حفظ النموذج في قاعدة البيانات');
        setIsLoading(false);
        return null;
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

  // Create a default form
  const createDefaultForm = async () => {
    try {
      setIsLoading(true);
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
      const formData: FormData = {
        id: newFormId,
        title: 'نموذج جديد',
        description: 'نموذج جديد',
        data: defaultTemplate.data,
        isPublished: false,
        shop_id: shopId,
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
          user_id: user?.id
        });
        
      if (error) {
        console.error('Error saving form to database:', error);
        toast.error('خطأ في حفظ النموذج في قاعدة البيانات');
        setIsLoading(false);
        return null;
      }

      setFormState(formData);
      toast.success('تم إنشاء نموذج جديد');
      
      // Refresh forms list
      fetchForms();
      
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
      
      console.log("Saving form with ID:", formId, "and data:", dbData);
      
      // Update form in Supabase
      const { data, error } = await supabase
        .from('forms')
        .update(dbData)
        .eq('id', formId)
        .select();
      
      if (error) {
        console.error('Error updating form:', error);
        toast.error('خطأ في تحديث النموذج');
        setIsLoading(false);
        return false;
      }
      
      console.log("Form saved successfully:", data);
      
      // Update local state if forms list is loaded
      if (forms.length > 0) {
        setForms(forms.map(form => 
          form.id === formId ? { ...form, ...formData } : form
        ));
      }
      
      // Update form state
      setFormState({
        ...formData,
        id: formId
      });
      
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
