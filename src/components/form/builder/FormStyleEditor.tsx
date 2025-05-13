
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

interface FormStyleEditorProps {
  formStyle?: any;
  onStyleChange?: (newStyle: any) => void;
}

const FormStyleEditor: React.FC<FormStyleEditorProps> = ({ formStyle = {}, onStyleChange = () => {} }) => {
  const { language } = useI18n();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'تنسيق النموذج' : 'Form Styling'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <p>{language === 'ar' ? 'إعدادات التنسيق' : 'Styling settings'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormStyleEditor;
