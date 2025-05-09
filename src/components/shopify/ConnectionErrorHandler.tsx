
import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ConnectionErrorHandlerProps {
  onRetrySuccess?: () => void;
  showReconnectButton?: boolean;
  showResetButton?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

const ConnectionErrorHandler: React.FC<ConnectionErrorHandlerProps> = ({
  onRetrySuccess,
  showReconnectButton = true,
  showResetButton = false,
  title = 'خطأ في الاتصال بـ Shopify',
  description,
  className = '',
}) => {
  const { testConnection, reload, disconnect } = useShopifyConnection();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  // Default error description if not provided
  const defaultDescription = description || 'رمز الوصول إلى Shopify غير صالح أو منتهي الصلاحية. الرجاء تحديث رمز الوصول.';
  
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Force refresh the connection state
      const success = await testConnection(true);
      
      if (success) {
        toast.success('تم تحديث الاتصال بنجاح');
        
        // Reload connection state to ensure UI is updated
        await reload();
        
        // Call the success callback if provided
        if (onRetrySuccess) {
          onRetrySuccess();
        }
        
        // Clear localStorage cache for products
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('products:') || key.startsWith('shopify_products:')) {
            localStorage.removeItem(key);
          }
        });
      } else {
        toast.error('فشل في تحديث الاتصال. يرجى التحقق من رمز الوصول.');
      }
    } catch (error) {
      console.error('Error retrying connection:', error);
      toast.error('حدث خطأ أثناء محاولة تحديث الاتصال');
    } finally {
      setIsRetrying(false);
    }
  };
  
  const handleReset = async () => {
    setIsResetting(true);
    try {
      // Disconnect completely from Shopify
      await disconnect();
      
      // Clear any Shopify-related items from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('shopify') || key.startsWith('products:')) {
          localStorage.removeItem(key);
        }
      });
      
      toast.success('تم إعادة تعيين حالة الاتصال بنجاح');
      
      // Navigate to the Shopify connection page
      navigate('/shopify');
    } catch (error) {
      console.error('Error resetting connection:', error);
      toast.error('حدث خطأ أثناء إعادة تعيين الاتصال');
    } finally {
      setIsResetting(false);
    }
  };
  
  const goToTokenUpdater = () => {
    navigate('/shopify?action=update-token');
  };

  return (
    <Card className={`border-red-200 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-red-600">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{defaultDescription}</AlertDescription>
        </Alert>
        
        <div className="text-sm space-y-2 text-gray-600">
          <p><strong>أسباب محتملة:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>رمز الوصول منتهي الصلاحية أو غير صالح</li>
            <li>تم تغيير إعدادات التطبيق في متجر Shopify</li>
            <li>مشاكل في اتصال الشبكة</li>
          </ul>
          
          <p className="mt-3"><strong>الحلول:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>تحديث رمز الوصول في صفحة إعدادات Shopify</li>
            <li>محاولة إعادة الاتصال</li>
            <li>التحقق من اتصال الإنترنت</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {showReconnectButton && (
          <Button 
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري التحديث...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                تحديث الاتصال
              </>
            )}
          </Button>
        )}
        
        <Button 
          onClick={goToTokenUpdater}
        >
          تحديث رمز الوصول
        </Button>
        
        {showResetButton && (
          <Button 
            variant="destructive"
            onClick={handleReset}
            disabled={isResetting}
          >
            {isResetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري إعادة التعيين...
              </>
            ) : (
              'إعادة تعيين الاتصال'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ConnectionErrorHandler;
