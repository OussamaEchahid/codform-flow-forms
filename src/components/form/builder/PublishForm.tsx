
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n';
import { Check, Globe, AlertTriangle } from 'lucide-react';

interface PublishFormProps {
  isPublished: boolean;
  onPublish: (isPublished: boolean) => void;
}

const PublishForm: React.FC<PublishFormProps> = ({ isPublished, onPublish }) => {
  const { language } = useI18n();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isPublished ? (
                <div className="bg-green-100 p-2 rounded-full">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="bg-amber-100 p-2 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
              )}
              <div className={`${language === 'ar' ? 'mr-2' : 'ml-2'}`}>
                <div className="font-medium">
                  {isPublished ? 
                    (language === 'ar' ? 'النموذج منشور' : 'Form is published') : 
                    (language === 'ar' ? 'النموذج غير منشور' : 'Form is not published')
                  }
                </div>
                <div className="text-sm text-gray-500">
                  {isPublished ? 
                    (language === 'ar' ? 'يمكن للزوار الوصول إلى هذا النموذج' : 'Visitors can access this form') : 
                    (language === 'ar' ? 'لا يمكن للزوار الوصول إلى هذا النموذج' : 'Visitors cannot access this form')
                  }
                </div>
              </div>
            </div>
            
            <Switch 
              checked={isPublished}
              onCheckedChange={onPublish}
            />
          </div>
        </CardContent>
      </Card>
      
      {isPublished && (
        <div className="mt-6">
          <div className="mb-4">
            <h3 className={`font-medium text-lg ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'روابط النموذج' : 'Form Links'}
            </h3>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-gray-500" />
                  <span className={`font-mono text-sm ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    /forms/view/[form-id]
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  {language === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className={`mt-6 ${language === 'ar' ? 'text-right' : ''}`}>
        <Button
          variant={isPublished ? "destructive" : "default"}
          onClick={() => onPublish(!isPublished)}
        >
          {isPublished ? 
            (language === 'ar' ? 'إلغاء النشر' : 'Unpublish Form') : 
            (language === 'ar' ? 'نشر النموذج' : 'Publish Form')
          }
        </Button>
      </div>
    </div>
  );
};

export default PublishForm;
