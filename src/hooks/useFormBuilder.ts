
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
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  });
  
  // Function to handle style changes
  const handleStyleChange = (key: string, value: string) => {
    setFormStyle({
      ...formStyle,
      [key]: value
    });
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
  
  // Create default form fields with all required fields
  const createCompleteDefaultForm = (): FormStep[] => {
    const defaultFields: FormField[] = [];
    
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
    
    const defaultStep: FormStep = {
      id: '1',
      title: language === 'ar' ? 'الخطوة الرئيسية' : 'Main Step',
      fields: defaultFields
    };
    
    return [defaultStep];
  };
  
  // Effect to initialize the form with default fields if needed
  useEffect(() => {
    // If the data is empty, we create a default form with all required fields
    if (initialFormData.data.length === 0) {
      const completeDefaultForm = createCompleteDefaultForm();
      setFormSteps(completeDefaultForm);
      setPreviewRefresh(prev => prev + 1);
    } else if (initialFormData.data.length > 0) {
      // Check if the form has all required fields
      const allFields = initialFormData.data.flatMap(step => step.fields);
      const hasName = allFields.some(f => f.type === 'text' && f.label.includes(language === 'ar' ? 'اسم' : 'name'));
      const hasPhone = allFields.some(f => f.type === 'phone');
      const hasAddress = allFields.some(f => f.type === 'textarea' && f.label.includes(language === 'ar' ? 'عنوان' : 'address'));
      const hasSubmit = allFields.some(f => f.type === 'submit');
      
      // If missing any required field, add the complete default form
      if (!hasName || !hasPhone || !hasAddress || !hasSubmit) {
        const completeDefaultForm = createCompleteDefaultForm();
        setFormSteps(completeDefaultForm);
        setPreviewRefresh(prev => prev + 1);
      } else {
        // Filter out any title fields from existing forms
        const updatedSteps = formSteps.map(step => {
          return {
            ...step,
            fields: step.fields.filter(field => field.type !== 'form-title' && field.type !== 'title' && field.type !== 'edit-form-title')
          };
        });
        setFormSteps(updatedSteps);
        setPreviewRefresh(prev => prev + 1);
      }
    }
  }, [initialFormData]); // Removed language dependency to prevent re-running

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
    addFieldToStep
  };
};

export default useFormBuilder;
