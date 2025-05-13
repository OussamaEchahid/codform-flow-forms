
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { FormField, FloatingButtonConfig } from '@/lib/form-utils';

interface FormPreviewProps {
  children?: React.ReactNode;
  formTitle?: string;
  formDescription?: string;
  currentStep?: number;
  totalSteps?: number;
  formStyle?: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
  fields?: FormField[];
  floatingButton?: FloatingButtonConfig;
  hideFloatingButtonPreview?: boolean;
}

const FormPreview: React.FC<FormPreviewProps> = ({
  children,
  formTitle,
  formDescription,
  currentStep = 1,
  totalSteps = 1,
  formStyle = {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  },
  fields = [],
  floatingButton,
  hideFloatingButtonPreview = false
}) => {
  const { language } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'معاينة النموذج' : 'Form Preview'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 border rounded-md">
          <div className="text-center p-8">
            <p className="text-gray-500">
              {language === 'ar' 
                ? 'سيتم عرض معاينة النموذج هنا عند تحرير المحتوى' 
                : 'Form preview will appear here as you edit content'}
            </p>
          </div>
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormPreview;
