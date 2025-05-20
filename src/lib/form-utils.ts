
import { ReactNode } from 'react';

// Define FormFieldType as a string type
export type FormFieldType = string;

// Extended the FormFieldStyle interface to include all properties
export interface FormFieldStyle {
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: string;
  fontSize?: string;
  descriptionColor?: string;
  descriptionFontSize?: string;
  borderRadius?: string;
  paddingY?: string;
  showTitle?: boolean;
  showDescription?: boolean;
  animation?: boolean;
  animationType?: 'pulse' | 'bounce' | 'shake' | 'wiggle' | 'flash';
  borderColor?: string;
  borderWidth?: string;
  showLabel?: boolean;
  labelColor?: string;
  labelFontSize?: string;
  labelFontWeight?: string;
  showIcon?: boolean;
  iconPosition?: string;
  fullWidth?: boolean;
  fontFamily?: string;
  // Add any other style properties you need
  [key: string]: any;
}

// Add all needed properties to the FormField interface
export interface FormField {
  type: string;
  id: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  icon?: string;
  style?: FormFieldStyle;
  options?: Array<{
    value: string;
    label: string;
  }>;
  defaultValue?: string | number | boolean;
  dependsOn?: string;
  showWhen?: any;
  displayFormat?: string;
  columns?: number;
  multipleCountLimit?: number;
  hideLabel?: boolean;
  step?: number;
  min?: number;
  max?: number;
  rows?: number;
  validationRules?: {
    [key: string]: any;
  };
  settings?: {
    [key: string]: any;
  };
  disabled?: boolean;
  inputFor?: string;
  errorMessage?: string;
  content?: string;
  src?: string;
  alt?: string;
  width?: string | number;
  className?: string;
  whatsappNumber?: string;
  message?: string;
}

export interface FormStep {
  id: string;
  title?: string;
  fields: FormField[];
}

export interface FloatingButtonConfig {
  enabled: boolean;
  text: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  paddingY?: string;
  marginBottom?: string;
  showIcon?: boolean;
  icon?: string;
  animation?: string;
  position?: 'bottom' | 'top' | 'left' | 'right';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

// Helper functions for form utilities

/**
 * Deep clone form fields to prevent mutation issues
 */
export const deepCloneField = (field: FormField): FormField => {
  if (!field) return field;
  
  try {
    // Create a completely new field object using deep copy
    const newField: FormField = JSON.parse(JSON.stringify(field));
    
    // Always preserve the ID
    newField.id = field.id;
    
    // Deep clone style - ensure textAlign is typed correctly
    if (field.style) {
      // First create a deep copy
      newField.style = JSON.parse(JSON.stringify(field.style));
      
      // Ensure textAlign is one of the allowed values
      if (field.style.textAlign) {
        const align = field.style.textAlign as string;
        newField.style.textAlign = 
          (align === 'left' || align === 'center' || align === 'right') 
            ? align as 'left' | 'center' | 'right'
            : (align === 'justify' ? 'left' : 'center') as 'left' | 'center' | 'right';
      }
      
      // Make sure backgroundColor is preserved
      if (field.style.backgroundColor) {
        newField.style.backgroundColor = field.style.backgroundColor;
      }
      
      // Ensure animation type is valid
      if (field.style.animationType) {
        const animType = field.style.animationType as string;
        const validTypes = ['pulse', 'bounce', 'shake', 'wiggle', 'flash'];
        newField.style.animationType = 
          validTypes.includes(animType) 
            ? animType as 'pulse' | 'bounce' | 'shake' | 'wiggle' | 'flash'
            : 'pulse';
      }
      
      // Preserve showTitle and showDescription
      if (field.style.showTitle !== undefined) {
        newField.style.showTitle = field.style.showTitle;
      }
      
      if (field.style.showDescription !== undefined) {
        newField.style.showDescription = field.style.showDescription;
      }
    }
    
    return newField;
  } catch (error) {
    console.error('Error in deepCloneField:', error);
    // Fallback to simple object copy if JSON parsing fails
    return { ...field, style: field.style ? { ...field.style } : undefined };
  }
};

/**
 * Deep clone a step including all its fields
 */
export const deepCloneStep = (step: FormStep): FormStep => {
  if (!step) return step;
  
  try {
    return {
      ...step,
      id: step.id,
      fields: step.fields?.map(field => deepCloneField(field)) || []
    };
  } catch (error) {
    console.error('Error in deepCloneStep:', error);
    // Fallback to simple object copy
    return { ...step, fields: [...step.fields] };
  }
};

// Add helper functions for form creation
export const createEmptyField = (type: string): FormField => {
  const field: FormField = {
    id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    label: '',
    required: false
  };
  
  // Add default properties based on field type
  switch (type) {
    case 'form-title':
      field.label = 'Form Title';
      field.helpText = 'Form Description';
      field.style = {
        backgroundColor: '#9b87f5',
        color: '#ffffff',
        textAlign: 'center' as 'center',
        showTitle: true,
        showDescription: true
      };
      break;
    case 'submit':
      field.label = 'Submit Form';
      field.style = {
        backgroundColor: '#9b87f5',
        color: '#ffffff',
        animation: true,
        animationType: 'pulse' as 'pulse'
      };
      break;
    case 'text/html':
      field.content = '<p>HTML Content</p>';
      break;
  }
  
  return field;
};

export const createDefaultForm = (): FormStep[] => {
  return [
    {
      id: '1',
      title: 'Step 1',
      fields: [
        createEmptyField('form-title'),
        createEmptyField('text'),
        createEmptyField('submit')
      ]
    }
  ];
};

// Add basic form templates
export const formTemplates = [
  {
    id: 1,
    title: 'Contact Form',
    description: 'Basic contact form with name, email and message',
    primaryColor: '#9b87f5',
    data: [
      {
        id: '1',
        title: 'Contact Information',
        fields: [
          {
            id: 'contact-title',
            type: 'form-title',
            label: 'Contact Us',
            helpText: 'Please fill out the form below',
            style: {
              backgroundColor: '#9b87f5',
              color: '#ffffff',
              textAlign: 'center' as 'center',
              showTitle: true,
              showDescription: true
            }
          },
          {
            id: 'contact-name',
            type: 'text',
            label: 'Name',
            required: true,
            icon: 'user'
          },
          {
            id: 'contact-email',
            type: 'email',
            label: 'Email',
            required: true,
            icon: 'mail'
          },
          {
            id: 'contact-message',
            type: 'textarea',
            label: 'Message',
            required: true,
            rows: 4
          },
          {
            id: 'contact-submit',
            type: 'submit',
            label: 'Send Message',
            style: {
              backgroundColor: '#9b87f5',
              color: '#ffffff',
              animation: true,
              animationType: 'pulse' as 'pulse'
            }
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Order Form',
    description: 'Product order form with shipping details',
    primaryColor: '#9b87f5',
    data: [
      {
        id: '1',
        title: 'Customer Information',
        fields: [
          {
            id: 'order-title',
            type: 'form-title',
            label: 'Place Your Order',
            helpText: 'Fill out your details below',
            style: {
              backgroundColor: '#9b87f5',
              color: '#ffffff',
              textAlign: 'center' as 'center'
            }
          },
          {
            id: 'order-name',
            type: 'text',
            label: 'Full Name',
            required: true,
            icon: 'user'
          },
          {
            id: 'order-phone',
            type: 'phone',
            label: 'Phone Number',
            required: true,
            icon: 'phone'
          },
          {
            id: 'order-address',
            type: 'textarea',
            label: 'Shipping Address',
            required: true,
            icon: 'map-pin',
            rows: 3
          }
        ]
      },
      {
        id: '2',
        title: 'Order Details',
        fields: [
          {
            id: 'order-products',
            type: 'cart-items',
            label: 'Selected Products'
          },
          {
            id: 'order-summary',
            type: 'cart-summary',
            label: 'Order Summary'
          },
          {
            id: 'order-submit',
            type: 'submit',
            label: 'Complete Order',
            style: {
              backgroundColor: '#9b87f5',
              color: '#ffffff',
              animation: true,
              animationType: 'pulse' as 'pulse'
            }
          }
        ]
      }
    ]
  }
];
