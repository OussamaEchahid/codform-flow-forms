import { useState } from 'react';
import { useFormStore } from './useFormStore';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { FormData } from '@/lib/form-utils';

export interface FormTemplate {
  id: number;
  title: string;
  description: string;
  primaryColor: string;
  data: FormStep[];
}

export interface FormStep {
  step: number;
  title: string;
  fields: FormField[];
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  content?: string;
}

export const useFormTemplates = () => {
  const { setFormState } = useFormStore();
  const { shopify } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const createFormFromTemplate = async (templateId: number) => {
    try {
      setIsLoading(true);
      const template = formTemplates.find(t => t.id === templateId);
      if (!template) {
        toast.error('Template not found');
        return;
      }

      const newFormId = Math.random().toString(36).substring(2, 15);
      const formData: FormData = {
        id: newFormId,
        title: template.title,
        description: template.description,
        data: template.data,
        isPublished: false,
        shop_id: shopify?.shop
      };

      setFormState(formData);
      toast.success(`Created form from template ${template.title}`);
      
      if (shopify.shop) {
        await shopify.syncForm({
          formId: newFormId,
          shopDomain: shopify.shop,
          settings: {
            position: 'product-page',
            blockId: `form-${newFormId}`
          }
        });
      }
      
    } catch (error) {
      console.error('Error creating form from template', error);
      toast.error('Error creating form from template');
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    createFormFromTemplate,
    isLoading
  };
};

export const formTemplates: FormTemplate[] = [
  {
    id: 1,
    title: 'Cash on Delivery Form',
    description: 'A simple form to collect customer information for cash on delivery orders.',
    primaryColor: '#9b87f5',
    data: [
      {
        step: 1,
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
        step: 1,
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
        step: 1,
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
        step: 2,
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
