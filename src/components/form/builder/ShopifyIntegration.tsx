import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';
import { Check, Copy, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  const [hideHeader] = useState(true);
  
  // إعادة تعيين حالة النسخ بعد 3 ثوانٍ
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

  // Check if the form ID is in the correct UUID format
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formId);
  
  // Generate correct form preview URL
  const formPreviewUrl = `https://codform-flow-forms.lovable.app/embed/${formId}`;

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
          <Alert variant={isValidUuid ? "default" : "destructive"} className={isValidUuid ? "bg-blue-50 border-blue-200" : ""}>
            <AlertDescription className={`${isValidUuid ? "text-blue-800" : ""} ${language === 'ar' ? 'text-right' : ''}`}>
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
              <code className={`p-2 ${!isValidUuid ? 'bg-red-50 border-red-200 border' : 'bg-gray-100'} rounded text-sm flex-1`}>{formId}</code>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2" 
                onClick={handleCopyFormId}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            
            {!isValidUuid && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {language === 'ar' 
                    ? 'تنبيه: معرّف النموذج غير بالتنسيق الصحيح. يجب أن يكون بتنسيق UUID كامل مثل: "6942b35d-ad06-40fb-8f70-86230d20b0fd"' 
                    : 'Warning: Form ID is not in the correct format. It must be a full UUID format like: "6942b35d-ad06-40fb-8f70-86230d20b0fd"'}
                </AlertDescription>
              </Alert>
            )}
            
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
            
            {/* إضافة معاينة الرابط */}
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className={`text-sm font-medium mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' ? 'رابط معاينة النموذج:' : 'Form Preview URL:'}
              </p>
              <div className="flex items-center justify-between">
                <code className="p-2 bg-white border rounded text-xs flex-1 overflow-x-auto">
                  {formPreviewUrl}
                </code>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => {
                    window.open(formPreviewUrl, '_blank');
                  }}
                >
                  <ExternalLink size={14} />
                </Button>
              </div>
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
              <div className="font-bold mb-2">
                {language === 'ar' 
                  ? 'هام: معرف النموذج بتنسيق UUID الكامل' 
                  : 'IMPORTANT: Full UUID format required'}
              </div>
              {language === 'ar' 
                ? 'يجب استخدام معرف النموذج بالتنسيق الكامل (UUID)، مثل: "6942b35d-ad06-40fb-8f70-86230d20b0fd". استخدام تنسيق آخر سيؤدي إلى عدم ظهور النموذج.' 
                : 'You must use the complete form ID format (UUID), such as: "6942b35d-ad06-40fb-8f70-86230d20b0fd". Using any other format will cause the form not to appear.'}
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
          
          <Alert variant="default" className="bg-orange-50 border-orange-200">
            <ExternalLink className="h-4 w-4 text-orange-600" />
            <AlertDescription className={`text-orange-800 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar'
                ? 'عند مواجهة خطأ "Failed to fetch" في متجرك، تأكد من أن متصفحك يسمح بالاتصال بـ Supabase، وأن النموذج بالتنسيق الصحيح ومنشور.'
                : 'If you encounter a "Failed to fetch" error in your store, ensure your browser allows connections to Supabase, and that your form has the correct format and is published.'}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyIntegration;
