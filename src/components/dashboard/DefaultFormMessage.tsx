import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface DefaultFormMessageProps {
  onCreateForm: () => void;
  isLoading?: boolean;
}

const DefaultFormMessage: React.FC<DefaultFormMessageProps> = ({
  onCreateForm,
  isLoading = false
}) => {
  const { language } = useI18n();

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {language === 'ar' ? 'أهلاً بك في منشئ النماذج' : 'Welcome to Form Builder'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground text-lg">
            {language === 'ar' 
              ? 'لم يتم العثور على أي نماذج. ابدأ بإنشاء نموذجك الأول لجمع بيانات العملاء وزيادة المبيعات.'
              : 'No forms found. Start by creating your first form to collect customer data and boost sales.'
            }
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={onCreateForm}
              disabled={isLoading}
              size="lg"
              className="w-full max-w-xs mx-auto flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
            </Button>
            
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? 'سيتم إنشاء نموذج افتراضي يحتوي على الحقول الأساسية التي يمكنك تخصيصها لاحقاً'
                : 'A default form with basic fields will be created that you can customize later'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DefaultFormMessage;