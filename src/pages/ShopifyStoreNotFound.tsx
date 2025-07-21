import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ExternalLink, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

interface ShopifyStoreNotFoundProps {
  shopDomain: string;
  onRetry?: () => void;
}

const ShopifyStoreNotFound: React.FC<ShopifyStoreNotFoundProps> = ({ 
  shopDomain, 
  onRetry 
}) => {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    try {
      setIsReconnecting(true);
      
      // مسح بيانات الاتصال القديمة
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_active_store');
      shopifyConnectionManager.clearAllStores();
      
      toast.success('تم مسح بيانات الاتصال القديمة، سيتم إعادة التوجيه للربط...');
      
      // التوجيه لصفحة الربط
      setTimeout(() => {
        window.location.href = '/shopify-connect';
      }, 2000);
      
    } catch (error) {
      console.error('Error during reconnection:', error);
      toast.error('حدث خطأ أثناء إعادة الربط');
      setIsReconnecting(false);
    }
  };

  const handleGoToStores = () => {
    window.location.href = '/my-stores';
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            المتجر غير مربوط
          </CardTitle>
          <CardDescription>
            المتجر {shopDomain} غير موجود في قاعدة البيانات أو غير مربوط بشكل صحيح
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>المشكلة:</strong> المتجر {shopDomain} غير موجود في قاعدة البيانات.
              <br />
              <strong>الحل:</strong> يجب إعادة ربط المتجر من خلال عملية OAuth جديدة.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              {isReconnecting ? 'جارٍ إعادة الربط...' : 'إعادة ربط المتجر'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleGoToStores}
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

          <div className="text-sm text-muted-foreground">
            <p><strong>خطوات حل المشكلة:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>انقر على "إعادة ربط المتجر" أعلاه</li>
              <li>سيتم توجيهك لصفحة ربط Shopify</li>
              <li>أدخل عنوان متجرك مرة أخرى</li>
              <li>اكمل عملية الموافقة في Shopify</li>
              <li>ستعود تلقائياً للتطبيق بعد الربط الناجح</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyStoreNotFound;