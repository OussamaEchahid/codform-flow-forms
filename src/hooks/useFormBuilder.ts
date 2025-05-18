
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FormField, FormStep } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { FormData } from '@/lib/hooks/useFormTemplates';

interface UseFormBuilderProps {
  initialFormData: FormData;
}

export const useFormBuilder = ({ initialFormData }: UseFormBuilderProps) => {
  const { language } = useI18n();
  
  const [formTitle, setFormTitle] = useState(initialFormData.title);
  const [formDescription, setFormDescription] = useState(initialFormData.description || '');
  const [formSteps, setFormSteps] = useState<FormStep[]>(initialFormData.data);
  const [currentPreviewStep, setCurrentPreviewStep] = useState(1);
  const [currentEditStep, setCurrentEditStep] = useState(0);
  const [previewRefresh, setPreviewRefresh] = useState(0);
  const [formStyle, setFormStyle] = useState({
    primaryColor: initialFormData.style?.primaryColor || '#9b87f5',
    borderRadius: initialFormData.style?.borderRadius || '0.5rem',
    fontSize: initialFormData.style?.fontSize || '1rem',
    buttonStyle: initialFormData.style?.buttonStyle || 'rounded',
  });
  
  // Default form direction based on language - Arabic is RTL, other languages are LTR
  const [formDirection, setFormDirection] = useState<'ltr' | 'rtl'>(language === 'ar' ? 'rtl' : 'ltr');
  
  // Update form direction when language changes
  useEffect(() => {
    setFormDirection(language === 'ar' ? 'rtl' : 'ltr');
  }, [language]);
  
  // Function to handle style changes
  const handleStyleChange = (key: string, value: string) => {
    setFormStyle({
      ...formStyle,
      [key]: value
    });
    setPreviewRefresh(prev => prev + 1);
  };
  
  // Function to toggle form direction
  const toggleFormDirection = () => {
    setFormDirection(prev => prev === 'ltr' ? 'rtl' : 'ltr');
    setPreviewRefresh(prev => prev + 1);
  };
  
  // Add field to current step
  const addFieldToStep = (type: FormField['type']) => {
    const newField = createEmptyField(type);
    const updatedSteps = [...formSteps];
    updatedSteps[currentEditStep].fields.push(newField);
    setFormSteps(updatedSteps);
    setPreviewRefresh(prev => prev + 1);
  };
  
  // Create empty field helper function
  const createEmptyField = (type: FormField['type']) => {
    let newField: FormField = {
      id: uuidv4(),
      type,
      label: '',
      required: false,
    };
  
    // Add field-specific configuration
    switch (type) {
      case 'text':
        newField.label = language === 'ar' ? 'حقل نص' : 'Text Field';
        break;
      case 'email':
        newField.label = language === 'ar' ? 'بريد إلكتروني' : 'Email';
        break;
      case 'phone':
        newField.label = language === 'ar' ? 'رقم هاتف' : 'Phone Number';
        break;
      case 'textarea':
        newField.label = language === 'ar' ? 'نص متعدد الأسطر' : 'Multi-line Text';
        break;
      case 'select':
        newField.label = language === 'ar' ? 'قائمة منسدلة' : 'Dropdown';
        break;
      case 'checkbox':
        newField.label = language === 'ar' ? 'خانة اختيار' : 'Checkbox';
        break;
      case 'radio':
        newField.label = language === 'ar' ? 'زر راديو' : 'Radio Button';
        break;
      case 'cart-items':
        newField.label = language === 'ar' ? 'المنتج المختار' : 'Selected Product';
        break;
      case 'cart-summary':
        newField.label = language === 'ar' ? 'ملخص الطلب' : 'Order Summary';
        break;
      case 'submit':
        newField.label = language === 'ar' ? 'زر إرسال الطلب' : 'Submit Order';
        break;
      case 'text/html':
        newField.label = language === 'ar' ? 'نص/HTML' : 'Text/HTML';
        break;
      case 'title':
        newField.label = language === 'ar' ? 'عنوان قسم' : 'Section Title';
        break;
      default:
        newField.label = language === 'ar' ? 'حقل جديد' : 'New Field';
        break;
    }
  
    return newField;
  };
  
  return {
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    formSteps,
    setFormSteps,
    currentPreviewStep,
    setCurrentPreviewStep,
    currentEditStep,
    setCurrentEditStep,
    previewRefresh,
    setPreviewRefresh,
    formStyle,
    handleStyleChange,
    addFieldToStep,
    formDirection,
    setFormDirection,
    toggleFormDirection,
  };
};

export default useFormBuilder;
