
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

interface FormPreviewProps {
  children?: React.ReactNode;
}

const FormPreview: React.FC<FormPreviewProps> = ({ children }) => {
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
