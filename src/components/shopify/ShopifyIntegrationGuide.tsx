
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoCircle } from 'lucide-react';

// Define a simple Steps component since we don't have @/components/ui/steps
const Steps = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`space-y-4 ${className || ''}`} {...props}>
    {children}
  </div>
);

// Define a simple Step component
const Step = ({ 
  children, 
  title, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { title: string }) => (
  <div className={`border rounded-lg p-4 ${className || ''}`} {...props}>
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <div>{children}</div>
  </div>
);

const ShopifyIntegrationGuide = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-right">دليل ربط النماذج بمنتجات شوبيفاي</CardTitle>
      </CardHeader>
      <CardContent className="text-right">
        <Alert className="mb-4">
          <InfoCircle className="h-4 w-4" />
          <AlertTitle>هام: آلية ربط النماذج بالمنتجات</AlertTitle>
          <AlertDescription>
            لكي يظهر النموذج على صفحة منتج معين، هناك خطوتان رئيسيتان يجب إكمالهما.
          </AlertDescription>
        </Alert>

        <Steps className="mb-6">
          <Step title="الخطوة 1: ربط النموذج بالمنتجات">
            <p>في صفحة تحرير النموذج، انتقل إلى تبويب "تكامل شوبيفاي" واختر المنتجات التي 
              تريد ربط النموذج بها. هذا يسمح للنظام بمعرفة أي النماذج يجب عرضها مع أي منتجات.</p>
          </Step>
          
          <Step title="الخطوة 2: إضافة البلوك إلى قالب المنتج">
            <p>في متجر شوبيفاي الخاص بك، قم بتخصيص قالب المنتج وأضف بلوك "نموذج الدفع عند الاستلام".
              يمكنك القيام بذلك عن طريق:</p>
            <ol className="list-decimal mr-5 mt-2 space-y-2">
              <li>الذهاب إلى لوحة تحكم متجر شوبيفاي</li>
              <li>الانتقال إلى "المتجر عبر الإنترنت" {">"} "السمات" {">"} "تخصيص"</li>
              <li>اختيار صفحة المنتج</li>
              <li>النقر على "إضافة قسم" {">"} "التطبيقات"</li>
              <li>اختيار "نموذج الدفع عند الاستلام"</li>
              <li>ترك حقل معرف النموذج فارغاً إذا كنت قد قمت بالفعل بربط المنتجات في الخطوة 1</li>
            </ol>
          </Step>
          
          <Step title="اختياري: تحديد معرف النموذج مباشرة">
            <p>إذا كنت تريد عرض نموذج معين مع منتج دون إجراء الربط في الخطوة 1، يمكنك تحديد معرف النموذج مباشرةً في إعدادات البلوك في قالب المنتج.</p>
            <p className="mt-2">معرف النموذج الحالي: <span className="bg-muted p-1 rounded">{location.pathname.split('/').pop()}</span></p>
          </Step>
        </Steps>
        
        <Alert variant="info" className="mt-4">
          <InfoCircle className="h-4 w-4" />
          <AlertTitle>ملاحظة مهمة</AlertTitle>
          <AlertDescription>
            في معظم الحالات، يكفي ربط المنتجات في الخطوة 1 فقط. إذا واجهت أي مشكلات، حاول إضافة معرف النموذج يدوياً في إعدادات البلوك.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ShopifyIntegrationGuide;
