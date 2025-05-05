import { useState } from 'react';
import { useFormStore } from '@/hooks/useFormStore';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { FormField, FormStep } from '@/lib/form-utils';

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
  const { user } = useAuth(); // Remove session reference
  const [isLoading, setIsLoading] = useState(false);
  const [forms, setForms] = useState<FormData[]>([]);

  // Fetch all forms
  const fetchForms = async () => {
    try {
      setIsLoading(true);
      // Mock implementation - in a real app, fetch from backend
      setForms([]); // Reset forms
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching forms', error);
      toast.error('Error fetching forms');
      setIsLoading(false);
    }
  };

  // Create a form from template
  const createFormFromTemplate = async (templateId: number) => {
    try {
      setIsLoading(true);
      const template = formTemplates.find(t => t.id === templateId);
      if (!template) {
        toast.error('Template not found');
        setIsLoading(false);
        return null;
      }

      const newFormId = Math.random().toString(36).substring(2, 15);
      const formData: FormData = {
        id: newFormId,
        title: template.title,
        description: template.description,
        data: template.data,
        isPublished: false,
        // Remove direct shopify reference
      };

      setFormState(formData);
      toast.success(`Created form from template ${template.title}`);
      
      // Remove shopify sync code since it's not available in the auth context
      
      setIsLoading(false);
      return formData;
    } catch (error) {
      console.error('Error creating form from template', error);
      toast.error('Error creating form from template');
      setIsLoading(false);
      return null;
    }
  };

  // Create a default form
  const createDefaultForm = async () => {
    try {
      setIsLoading(true);
      const defaultTemplate = formTemplates[0]; // Use first template as default

      const newFormId = Math.random().toString(36).substring(2, 15);
      const formData: FormData = {
        id: newFormId,
        title: 'New Form',
        description: 'A new form',
        data: defaultTemplate.data,
        isPublished: false,
        // Remove direct shopify reference
      };

      setFormState(formData);
      toast.success('Created new form');
      
      setIsLoading(false);
      return formData;
    } catch (error) {
      console.error('Error creating default form', error);
      toast.error('Error creating default form');
      setIsLoading(false);
      return null;
    }
  };

  // Save form changes
  const saveForm = async (formId: string, formData: Partial<FormData>) => {
    try {
      setIsLoading(true);
      // Mock implementation - in a real app, save to backend
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error saving form', error);
      toast.error('Error saving form');
      setIsLoading(false);
      return false;
    }
  };

  // Publish or unpublish a form
  const publishForm = async (formId: string, publish: boolean) => {
    try {
      setIsLoading(true);
      // Mock implementation - in a real app, update in backend
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error publishing form', error);
      toast.error('Error publishing form');
      setIsLoading(false);
      return false;
    }
  };

  // Delete a form
  const deleteForm = async (formId: string) => {
    try {
      setIsLoading(true);
      // Mock implementation - in a real app, delete from backend
      setForms(forms.filter(form => form.id !== formId));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error deleting form', error);
      toast.error('Error deleting form');
      setIsLoading(false);
      return false;
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
    deleteForm
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
