import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ExternalLink, Settings, RefreshCw } from 'lucide-react';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

interface ShopifyErrorHandlerProps {
  error: string;
  onRetry?: () => void;
}

const ShopifyErrorHandler: React.FC<ShopifyErrorHandlerProps> = ({ error, onRetry }) => {
  const handleReconnect = async () => {
    try {
      // مسح بيانات الاتصال القديمة
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_active_store');
      shopifyConnectionManager.clearAllStores();
      
      // إعادة التوجيه لصفحة الربط
      window.location.href = '/shopify-connect';
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  // تحليل نوع الخطأ
  if (error?.startsWith('STORE_NOT_FOUND:')) {
    const shopDomain = error.split(':')[1];
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              المتجر غير مربوط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                المتجر <strong>{shopDomain}</strong> غير موجود في قاعدة البيانات. يجب إعادة ربطه.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleReconnect}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                إعادة ربط المتجر
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/my-stores'}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                إدارة المتاجر
              </Button>
              
              {onRetry && (
                <Button 
                  variant="secondary"
                  onClick={onRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة المحاولة
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error?.startsWith('TOKEN_MISSING:')) {
    const shopDomain = error.split(':')[1];
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              رمز الوصول مفقود
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                رمز الوصول مفقود للمتجر <strong>{shopDomain}</strong>. يجب إعادة ربط المتجر.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleReconnect}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                إعادة ربط المتجر
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/my-stores'}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                إدارة المتاجر
              </Button>
              
              {onRetry && (
                <Button 
                  variant="secondary"
                  onClick={onRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة المحاولة
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // خطأ عام
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            خطأ في تحميل المنتجات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-3">
            {onRetry && (
              <Button 
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/my-stores'}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              إدارة المتاجر
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyErrorHandler;