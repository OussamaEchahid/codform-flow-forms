
import React, { useState, useEffect, useRef } from 'react';
import { useShopify } from '@/hooks/useShopify';
import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Check, ShoppingCart, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export interface ShopifyIntegrationProps {
  formId: string;
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({ formId }) => {
  const { language } = useI18n();
  const { 
    syncForm, 
    isConnected,
    shop,
    products,
    isLoading: shopifyLoading,
    refreshConnection,
    loadProducts,
    failSafeMode 
  } = useShopify();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [productsCount, setProductsCount] = useState<number>(Array.isArray(products) ? products.length : 0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mounted = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);
  
  // Check connection and update UI
  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    
    // Update products count when products change
    if (Array.isArray(products)) {
      setProductsCount(products.length);
      setLastRefreshed(new Date());
    }
    
    // After initial load, update loading state
    setIsLoading(false);
  }, [isConnected, products]);
  
  // Handle form sync
  const handleSync = async () => {
    if (!formId || isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Reset error state
      setErrorMessage(null);
      
      // Attempt to sync
      const result = await syncForm(formId);
      
      if (mounted.current) {
        if (result && result.success) {
          toast.success(language === 'ar' 
            ? 'تم مزامنة النموذج مع Shopify بنجاح' 
            : 'Form successfully synced with Shopify');
        } else {
          const message = (result && result.message) 
            ? result.message 
            : (language === 'ar' ? 'فشل في المزامنة مع Shopify' : 'Failed to sync with Shopify');
          
          toast.error(message);
          setErrorMessage(message);
        }
      }
    } catch (error) {
      console.error('Error syncing form:', error);
      
      if (mounted.current) {
        const errorMsg = language === 'ar' 
          ? 'خطأ في مزامنة النموذج مع Shopify' 
          : 'Error syncing form with Shopify';
        
        toast.error(errorMsg);
        setErrorMessage(errorMsg);
      }
    } finally {
      if (mounted.current) {
        setIsSyncing(false);
      }
    }
  };
  
  // Handle retry connection
  const handleRetryConnection = async () => {
    setConnectionStatus('checking');
    setIsRefreshing(true);
    
    try {
      const isConnectedResult = await refreshConnection(true);
      
      if (mounted.current) {
        setConnectionStatus(isConnectedResult ? 'connected' : 'disconnected');
        
        // If connection was successful but we were previously disconnected
        if (isConnectedResult) {
          toast.success(language === 'ar' 
            ? 'تم الاتصال بـ Shopify بنجاح' 
            : 'Successfully connected to Shopify');
          
          // Also refresh products
          handleRefreshProducts();
        } else {
          toast.error(language === 'ar' 
            ? 'فشل في الاتصال بـ Shopify' 
            : 'Failed to connect to Shopify');
        }
      }
    } catch (error) {
      console.error('Error retrying connection:', error);
      
      if (mounted.current) {
        setConnectionStatus('disconnected');
        toast.error(language === 'ar' 
          ? 'خطأ في إعادة الاتصال' 
          : 'Error refreshing connection');
      }
    } finally {
      if (mounted.current) {
        setIsRefreshing(false);
      }
    }
  };
  
  // Handle refresh products
  const handleRefreshProducts = async () => {
    setIsRefreshing(true);
    
    try {
      const refreshedProducts = await loadProducts(true);
      
      if (mounted.current && Array.isArray(refreshedProducts)) {
        setProductsCount(refreshedProducts.length);
        setLastRefreshed(new Date());
        setErrorMessage(null);
        toast.success(language === 'ar' 
          ? `تم تحديث ${refreshedProducts.length} منتج` 
          : `Refreshed ${refreshedProducts.length} products`);
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
      
      if (mounted.current) {
        setErrorMessage(language === 'ar' ? 'فشل تحديث المنتجات' : 'Failed to refresh products');
        toast.error(language === 'ar' 
          ? 'فشل تحديث المنتجات، يرجى المحاولة مرة أخرى' 
          : 'Failed to refresh products, please try again');
      }
    } finally {
      if (mounted.current) {
        setIsRefreshing(false);
      }
    }
  };
  
  // Show connection status badge
  const statusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
            <Check className="h-3 w-3 mr-1" />
            {language === 'ar' ? 'متصل' : 'Connected'}
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            {language === 'ar' ? 'غير متصل' : 'Disconnected'}
          </Badge>
        );
      case 'checking':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            {language === 'ar' ? 'جاري الفحص...' : 'Checking...'}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <h2 className="text-xl font-semibold">
          {language === 'ar' ? 'تكامل Shopify' : 'Shopify Integration'}
        </h2>
        
        <div className="flex items-center gap-2">
          {statusBadge()}
          {shop && (
            <div className="text-sm text-gray-500">
              {shop}
            </div>
          )}
        </div>
      </div>
      
      {failSafeMode && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle>{language === 'ar' ? 'وضع الطوارئ' : 'Fail-safe Mode'}</AlertTitle>
          <AlertDescription className="text-amber-700 text-sm">
            {language === 'ar' 
              ? 'هناك مشكلة في اتصال Shopify. تم تفعيل وضع الطوارئ للحفاظ على استمرارية الخدمة.' 
              : 'There is an issue with the Shopify connection. Fail-safe mode is activated for continuity.'}
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {language === 'ar' ? 'معلومات المتجر' : 'Store Information'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'حالة اتصال المتجر ومنتجاته' 
                  : 'Store connection status and products'}
              </CardDescription>
            </div>
            <ShoppingCart className="h-6 w-6 text-gray-400" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-3">
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-gray-500 block">
                {language === 'ar' ? 'حالة الاتصال:' : 'Connection:'}
              </span>
              <span>
                {connectionStatus === 'connected' 
                  ? (language === 'ar' ? 'متصل بـ Shopify' : 'Connected to Shopify')
                  : (language === 'ar' ? 'غير متصل' : 'Not connected')}
              </span>
            </div>
            
            <div className="space-y-1">
              <span className="text-gray-500 block">
                {language === 'ar' ? 'عدد المنتجات:' : 'Products Count:'}
              </span>
              <span className="text-sm">
                {isLoading || isRefreshing || shopifyLoading
                 ? <Loader2 className="h-3 w-3 animate-spin inline ml-2" /> 
                 : productsCount}
              </span>
            </div>
            
            {lastRefreshed && (
              <div className="col-span-2 space-y-1">
                <span className="text-gray-500 block">
                  {language === 'ar' ? 'آخر تحديث:' : 'Last Refreshed:'}
                </span>
                <span className="text-xs text-gray-600">
                  {lastRefreshed.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryConnection}
            disabled={connectionStatus === 'checking' || isRefreshing}
          >
            {connectionStatus === 'checking' || isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جاري الفحص...' : 'Checking...'}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إعادة الاتصال' : 'Reconnect'}
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshProducts}
            disabled={isLoading || isRefreshing || connectionStatus !== 'connected'}
          >
            {isLoading || isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جاري التحديث...' : 'Refreshing...'}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تحديث المنتجات' : 'Refresh Products'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>
            {language === 'ar' ? 'ربط النموذج بالمتجر' : 'Form Integration'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'مزامنة هذا النموذج مع متجر Shopify' 
              : 'Sync this form with your Shopify store'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-3">
          <p className="text-sm text-gray-600 mb-4">
            {language === 'ar' 
              ? 'المزامنة تعني أن هذا النموذج سيكون متاحًا في متجرك كنموذج طلب يمكن للعملاء استخدامه.' 
              : 'Syncing means this form will be available in your store as an order form that customers can use.'}
          </p>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleSync} 
            disabled={connectionStatus !== 'connected' || isSyncing}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جاري المزامنة...' : 'Syncing...'}
              </>
            ) : (
              language === 'ar' ? 'مزامنة النموذج مع Shopify' : 'Sync Form with Shopify'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ShopifyIntegration;
