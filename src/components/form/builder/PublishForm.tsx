
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PublishFormProps {
  isPublished: boolean;
  onPublish: (publish: boolean) => Promise<void>;
}

const PublishForm: React.FC<PublishFormProps> = ({ isPublished, onPublish }) => {
  const { language } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'نشر النموذج' : 'Publish Form'}
        </CardTitle>
        <CardDescription className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' 
            ? 'قم بنشر النموذج ليظهر في المتجر' 
            : 'Publish your form to make it visible in your store'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Label htmlFor="publish-form" className="flex flex-col space-y-1">
              <span className="font-medium">
                {isPublished 
                  ? (language === 'ar' ? 'النموذج منشور' : 'Form is published') 
                  : (language === 'ar' ? 'النموذج غير منشور' : 'Form is not published')}
              </span>
              <span className="text-sm text-muted-foreground">
                {isPublished 
                  ? (language === 'ar' ? 'النموذج مرئي للعملاء' : 'Form is visible to customers') 
                  : (language === 'ar' ? 'النموذج غير مرئي للعملاء' : 'Form is hidden from customers')}
              </span>
            </Label>
            <Switch 
              id="publish-form"
              checked={isPublished}
              onCheckedChange={onPublish}
            />
          </div>

          <div className="border rounded-md p-4 bg-gray-50">
            <h3 className={`font-medium mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'حالة النموذج' : 'Form Status'}
            </h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isPublished ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span>
                {isPublished 
                  ? (language === 'ar' ? 'منشور' : 'Published') 
                  : (language === 'ar' ? 'مسودة' : 'Draft')}
              </span>
            </div>
          </div>

          <Button 
            className="w-full" 
            variant={isPublished ? "outline" : "default"} 
            onClick={() => onPublish(!isPublished)}
          >
            {isPublished
              ? (language === 'ar' ? 'إلغاء نشر النموذج' : 'Unpublish Form')
              : (language === 'ar' ? 'نشر النموذج' : 'Publish Form')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublishForm;
