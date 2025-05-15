
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';
import { Info, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ShopifyIntegrationProps {
  formId: string;
  formTitle?: string;
  formDescription?: string;
  formStyle?: {
    primaryColor?: string;
  };
  onSave?: (settings: any) => void;
  isSyncing?: boolean;
  formTitleElement?: any;
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({ 
  formId,
  formTitle,
  formDescription,
  formStyle = { primaryColor: '#9b87f5' },
  isSyncing = false,
  formTitleElement,
  onSave
}) => {
  const { t, language } = useI18n();
  const [hideHeader] = useState(true);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'دمج النموذج في متجرك' : 'Integrate Form in Your Store'}
        </CardTitle>
        <CardDescription className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' 
            ? 'سيتم استخدام هذا النموذج تلقائياً في متجرك عند إضافة البلوك إلى صفحة المنتج' 
            : 'This form will be used automatically in your store when adding the block to the product page'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <AlertDescription className={`text-blue-800 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' 
                ? 'لإضافة هذا النموذج في متجرك، اتبع هذه الخطوات:' 
                : 'To add this form to your store, follow these steps:'}
              <ol className={`mt-2 list-decimal ${language === 'ar' ? 'mr-4' : 'ml-4'} space-y-1`}>
                <li>
                  {language === 'ar' 
                    ? 'اذهب إلى "تخصيص المتجر" ثم انتقل إلى صفحة المنتج' 
                    : 'Go to "Customize Store" then navigate to the product page'}
                </li>
                <li>
                  {language === 'ar' 
                    ? 'انقر على "إضافة كتلة" واختر "نموذج الدفع عند الاستلام"' 
                    : 'Click "Add Block" and choose "Cash On Delivery Form"'}
                </li>
                <li>
                  {language === 'ar' 
                    ? 'سيظهر النموذج تلقائياً دون الحاجة لإعدادات إضافية' 
                    : 'The form will appear automatically without needing additional settings'}
                </li>
              </ol>
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between py-2 border-t">
              <Label htmlFor="hide-header" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'إخفاء ترويسة النموذج في المتجر (مفعل افتراضيًا)' : 'Hide form header in store (enabled by default)'}
                <p className="text-sm text-gray-500 mt-1">
                  {language === 'ar' 
                    ? 'الترويسة مخفية تلقائيًا لتجنب العناوين المكررة في صفحة المنتج' 
                    : 'The header is hidden automatically to avoid duplicate titles in the product page'}
                </p>
              </Label>
              <Switch 
                id="hide-header"
                checked={hideHeader}
                disabled={true} 
              />
            </div>
            
            {formTitleElement && (
              <div className={`flex flex-row items-center ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                <span className={`text-sm font-medium ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
                  {language === 'ar' ? 'عنوان النموذج المخصص:' : 'Custom Form Title:'}
                </span>
                <div className="p-2 bg-gray-100 rounded text-sm flex-1">
                  <span className="font-semibold">✓</span> {language === 'ar' ? 'تم تعيين عنوان مخصص' : 'Custom title configured'}
                </div>
              </div>
            )}
            
            {formTitle && !formTitleElement && (
              <div className={`flex flex-row items-center ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                <span className={`text-sm font-medium ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
                  {language === 'ar' ? 'عنوان النموذج:' : 'Form Title:'}
                </span>
                <span className="p-2 bg-gray-100 rounded text-sm flex-1">{formTitle}</span>
              </div>
            )}
            
            <div className={`flex flex-col ${language === 'ar' ? 'items-end' : 'items-start'}`}>
              <span className="text-sm font-medium mb-2">
                {language === 'ar' ? 'إعدادات التنسيق:' : 'Styling Settings:'}
              </span>
              <div className="flex flex-wrap gap-2 w-full">
                {formStyle.primaryColor && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formStyle.primaryColor }}></div>
                    {language === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className={`text-amber-800 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' 
                ? 'تأكد من نشر النموذج قبل استخدامه في متجرك. النماذج غير المنشورة لن تظهر للعملاء.' 
                : 'Make sure to publish the form before using it in your store. Unpublished forms will not appear to customers.'}
            </AlertDescription>
          </Alert>
          
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className={`text-blue-800 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' 
                ? 'ملاحظة: بعض أنواع الحقول قد تظهر مختلفة أو لا تعمل بشكل كامل في المتجر مقارنة بالمعاينة. الحقول المدعومة بشكل كامل هي: الحقول النصية، مربعات الاختيار، أزرار الراديو، العناوين، وأزرار الإرسال.' 
                : 'Note: Some field types may appear differently or not work fully in the store compared to the preview. Fully supported fields are: text fields, checkboxes, radio buttons, titles, and submit buttons.'}
            </AlertDescription>
          </Alert>
          
          <Alert variant="default" className="bg-green-50 border-green-200">
            <Info className="h-4 w-4 text-green-600" />
            <AlertDescription className={`text-green-800 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar'
                ? 'نصيحة: أضف حقل "عنوان نموذج" (form-title) لتحسين شكل النموذج في المتجر وتجنب العناوين المكررة.'
                : 'Tip: Add a "Form Title" field to improve the form appearance in your store and avoid duplicate headings.'}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyIntegration;
