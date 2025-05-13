
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface PublishFormProps {
  isPublished: boolean;
  onPublish: (publish: boolean) => void;
}

const PublishForm: React.FC<PublishFormProps> = ({ isPublished, onPublish }) => {
  const { language } = useI18n();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'نشر النموذج' : 'Publish Form'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' 
              ? isPublished ? 'النموذج منشور حاليًا' : 'النموذج غير منشور' 
              : isPublished ? 'Form is currently published' : 'Form is not published'}
          </p>
          
          <Button
            onClick={() => onPublish(!isPublished)}
            variant={isPublished ? "destructive" : "default"}
          >
            {language === 'ar' 
              ? isPublished ? 'إلغاء النشر' : 'نشر النموذج' 
              : isPublished ? 'Unpublish' : 'Publish Form'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublishForm;
