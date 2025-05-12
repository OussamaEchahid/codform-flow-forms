
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';
import { Check, Copy, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
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
  formTitleElement
}) => {
  const { t, language } = useI18n();
  const [copied, setCopied] = useState(false);
  
  // Reset copied state after 3 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (copied) {
      timeout = setTimeout(() => setCopied(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [copied]);
  
  const handleCopyFormId = () => {
    navigator.clipboard.writeText(formId);
    setCopied(true);
    toast.success(
      language === 'ar' 
        ? 'تم نسخ معرّف النموذج بنجاح' 
        : 'Form ID copied successfully'
    );
  };

  const unsupportedFieldTypes = ['countdown', 'cart-summary'];

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'دمج النموذج في متجرك' : 'Integrate Form in Your Store'}
        </CardTitle>
        <CardDescription className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' 
            ? 'لاستخدام هذا النموذج في متجرك، قم بنسخ معرّف النموذج واستخدامه في إعدادات البلوك داخل متجرك' 
            : 'To use this form in your store, copy the form ID and use it in the block settings in your store'}
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
                    ? 'الصق معرّف النموذج في حقل "معرّف النموذج" في الإعدادات' 
                    : 'Paste the form ID in the "Form ID" field in settings'}
                </li>
              </ol>
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col space-y-4">
            <div className={`flex flex-row items-center ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-sm font-medium ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
                {language === 'ar' ? 'معرّف النموذج:' : 'Form ID:'}
              </span>
              <code className="p-2 bg-gray-100 rounded text-sm flex-1">{formId}</code>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2" 
                onClick={handleCopyFormId}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyIntegration;
