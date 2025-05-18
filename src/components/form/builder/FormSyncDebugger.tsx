
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Bug, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Separator } from '@/components/ui/separator';

interface FormSyncDebuggerProps {
  field: FormField;
  formStyle?: Record<string, any>;
}

/**
 * مكون مساعد للتشخيص والتصحيح لمساعدة المستخدمين على فهم كيفية تعامل النماذج
 * مع التنسيقات المختلفة والتوافق بين وضع المعاينة والمتجر
 */
const FormSyncDebugger: React.FC<FormSyncDebuggerProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const [isOpen, setIsOpen] = React.useState(false);
  
  // التحقق من وجود كائن النمط
  const style = field.style || {};
  
  // قائمة الخصائص المدعومة لكل نوع حقل
  const supportedProperties: Record<string, string[]> = {
    'form-title': ['color', 'backgroundColor', 'fontSize', 'fontWeight', 'descriptionColor', 'descriptionFontSize', 'textAlign'],
    'submit': ['color', 'backgroundColor', 'fontSize', 'fontWeight', 'borderRadius', 'borderColor', 'borderWidth', 
              'paddingY', 'paddingX', 'animation', 'animationType', 'showIcon', 'icon', 'iconPosition'],
    // يمكن إضافة المزيد من أنواع الحقول هنا
  };
  
  // الخصائص المتاحة لهذا النوع من الحقول
  const fieldsProperties = supportedProperties[field.type] || [];
  
  // التحقق من الخصائص المفقودة أو غير المدعومة
  const missingProperties = fieldsProperties.filter(prop => style[prop as keyof typeof style] === undefined);
  const unsupportedProperties = Object.keys(style).filter(prop => !fieldsProperties.includes(prop));
  
  // بناء توصيات للتنسيق
  const recommendations: string[] = [];
  
  if (field.type === 'form-title' && style.textAlign !== 'center') {
    recommendations.push(language === 'ar' 
      ? 'يجب تعيين محاذاة العنوان إلى "وسط" للعرض الصحيح في المتجر'
      : 'Set title alignment to "center" for correct display in store');
  }
  
  if (field.type === 'submit' && style.animation && !style.animationType) {
    recommendations.push(language === 'ar'
      ? 'تأكد من تحديد نوع الرسوم المتحركة عند تمكين الرسوم المتحركة'
      : 'Specify animation type when enabling animations');
  }
  
  // عرض قيم التنسيق الحالية بتنسيق JSON
  const styleJSON = JSON.stringify(style, null, 2);
  
  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className="mb-4 border rounded-md bg-white"
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center">
          <Bug className="mr-2 h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-medium">
            {language === 'ar' ? 'مساعد تشخيص التنسيق' : 'Style Sync Debugger'}
          </h3>
        </div>
        
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent className="px-3 pb-3">
        <Separator className="mb-3" />
        
        <div className="text-sm">
          <p className="mb-2 font-medium">
            {language === 'ar' ? 'نوع الحقل:' : 'Field Type:'} <span className="font-normal">{field.type}</span>
          </p>
          
          {fieldsProperties.length > 0 ? (
            <>
              <p className="mb-2 font-medium">
                {language === 'ar' ? 'الخصائص المدعومة:' : 'Supported Properties:'}
              </p>
              <div className="mb-3 flex flex-wrap gap-1">
                {fieldsProperties.map(prop => (
                  <span 
                    key={prop} 
                    className={`px-2 py-1 rounded-md text-xs ${style[prop as keyof typeof style] !== undefined 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'}`}
                  >
                    {prop}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <Alert variant="warning" className="mb-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {language === 'ar' ? 'تحذير' : 'Warning'}
              </AlertTitle>
              <AlertDescription>
                {language === 'ar' 
                  ? 'هذا النوع من الحقول لا يحتوي على مواصفات تنسيق محددة'
                  : 'This field type has no specified styling properties'}
              </AlertDescription>
            </Alert>
          )}
          
          {missingProperties.length > 0 && (
            <Alert variant="default" className="mb-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {language === 'ar' ? 'خصائص مفقودة' : 'Missing Properties'}
              </AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {missingProperties.map(prop => (
                    <li key={prop}>{prop}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {unsupportedProperties.length > 0 && (
            <Alert variant="destructive" className="mb-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {language === 'ar' ? 'خصائص غير مدعومة' : 'Unsupported Properties'}
              </AlertTitle>
              <AlertDescription>
                <p>
                  {language === 'ar' 
                    ? 'هذه الخصائص قد لا تظهر بشكل صحيح في المتجر:' 
                    : 'These properties may not display correctly in the store:'}
                </p>
                <ul className="list-disc list-inside">
                  {unsupportedProperties.map(prop => (
                    <li key={prop}>{prop}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {recommendations.length > 0 && (
            <Alert variant="info" className="mb-3">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>
                {language === 'ar' ? 'توصيات' : 'Recommendations'}
              </AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="mt-3">
            <p className="font-medium mb-1">{language === 'ar' ? 'التنسيق الحالي:' : 'Current Style:'}</p>
            <pre className="bg-gray-100 p-2 rounded-md overflow-auto text-xs">
              {styleJSON}
            </pre>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FormSyncDebugger;
