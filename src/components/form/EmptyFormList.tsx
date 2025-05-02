
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

const EmptyFormList = () => {
  const { t } = useI18n();
  
  return (
    <Card className="bg-gray-50 border-dashed">
      <CardContent className="pt-6 text-center">
        <p className="text-gray-500 mb-4">
          {t('forms.noFormsAvailable') || 'لا توجد نماذج متاحة'}
        </p>
        <p className="text-sm text-gray-400">
          {t('forms.clickCreateNew') || 'انقر على زر "إنشاء نموذج جديد" لإضافة نموذج'}
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyFormList;
