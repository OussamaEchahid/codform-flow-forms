
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ShoppingBag } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ConnectionAlertProps {
  tokenError: boolean;
  failSafeMode: boolean;
}

export const ConnectionAlert: React.FC<ConnectionAlertProps> = ({ tokenError, failSafeMode }) => {
  const { language } = useI18n();
  
  if (!tokenError && !failSafeMode) return null;
  
  return (
    <div className="absolute top-0 left-0 right-0 z-50 px-4 py-2">
      <Alert variant="warning" className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">
          {language === 'ar' ? 'تحذير اتصال' : 'Connection Warning'}
        </AlertTitle>
        <AlertDescription className="text-amber-700">
          {language === 'ar' 
            ? 'هناك مشكلة في اتصال Shopify، تم تفعيل وضع الدعم الاحتياطي. يمكنك الاستمرار في إدارة النماذج ولكن بعض الوظائف قد لا تعمل بشكل صحيح.' 
            : 'There is an issue with the Shopify connection. Fail-safe mode has been activated. You can continue managing forms but some features may not work properly.'}
        </AlertDescription>
      </Alert>
    </div>
  );
};

interface ProductsAlertProps {
  associatedProducts: Array<{id: string, title: string}>;
  activeTab: 'dashboard' | 'editor';
}

export const ProductsAlert: React.FC<ProductsAlertProps> = ({ associatedProducts, activeTab }) => {
  const { language } = useI18n();
  
  if (!(activeTab === 'editor' && associatedProducts.length > 0)) return null;
  
  return (
    <div className="absolute top-0 left-0 right-0 z-40 px-4 py-2 mt-16">
      <Alert className="bg-blue-50 border-blue-200">
        <ShoppingBag className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">
          {language === 'ar' ? 'منتجات مرتبطة' : 'Associated Products'}
        </AlertTitle>
        <AlertDescription className="text-blue-700">
          {language === 'ar' 
            ? `هذا النموذج مرتبط بـ ${associatedProducts.length} منتج: ${associatedProducts.map(p => p.title).join(', ')}` 
            : `This form is associated with ${associatedProducts.length} product(s): ${associatedProducts.map(p => p.title).join(', ')}`}
        </AlertDescription>
      </Alert>
    </div>
  );
};
