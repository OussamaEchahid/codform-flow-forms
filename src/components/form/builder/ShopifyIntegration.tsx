
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Check, AlertCircle, ShoppingBag } from 'lucide-react';
import { useShopify } from '@/hooks/useShopify';
import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ShopifyIntegrationProps {
  formId: string;
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({ formId }) => {
  const { 
    shopifyStore, 
    products, 
    loadProducts, 
    isLoading, 
    error,
    refreshConnection,
    tokenError,
    isNetworkError
  } = useShopify();
  
  const { language } = useI18n();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [productsCount, setProductsCount] = useState<number>(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false); // Add local loading state for refresh operations
  const mounted = useRef(true);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check connection on mount with retry logic
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus('checking');
      
      try {
        const isConnected = await refreshConnection();
        
        if (mounted.current) {
          setConnectionStatus(isConnected ? 'connected' : 'disconnected');
          
          // If not connected but we have retry attempts left, retry
          if (!isConnected && retryCount.current < maxRetries) {
            retryCount.current++;
            
            console.log(`Connection check failed, retrying (${retryCount.current}/${maxRetries})...`);
            
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            
            retryTimeoutRef.current = setTimeout(() => {
              checkConnection();
            }, 2000 * retryCount.current); // Exponential backoff
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        
        if (mounted.current) {
          setConnectionStatus('disconnected');
        }
      }
    };
    
    checkConnection();
    
    return () => {
      mounted.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [refreshConnection]);
  
  // Load products on mount with retry logic
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // First try loading products
        await loadProducts();
        
        if (mounted.current) {
          setLastRefreshed(new Date());
        }
      } catch (error) {
        console.error('Error loading products:', error);
        
        // If we still have retry attempts, try again
        if (retryCount.current < maxRetries) {
          retryCount.current++;
          
          console.log(`Product loading failed, retrying (${retryCount.current}/${maxRetries})...`);
          
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          retryTimeoutRef.current = setTimeout(() => {
            fetchProducts();
          }, 2000 * retryCount.current); // Exponential backoff
        }
      }
    };
    
    fetchProducts();
    
    return () => {
      mounted.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [loadProducts]);
  
  // Update products count when products change
  useEffect(() => {
    if (products && products.length >= 0) {
      setProductsCount(products.length);
    }
  }, [products]);
  
  const handleRetryConnection = async () => {
    setConnectionStatus('checking');
    setIsRefreshing(true); // Use local state instead of setIsLoading
    
    try {
      const isConnected = await refreshConnection(true);
      
      if (mounted.current) {
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
        
        if (isConnected) {
          toast.success(language === 'ar' 
            ? 'تم تحديث الاتصال بنجاح' 
            : 'Connection refreshed successfully');
        } else {
          toast.error(language === 'ar' 
            ? 'فشل الاتصال بـ Shopify' 
            : 'Failed to connect to Shopify');
        }
      }
    } catch (error) {
      console.error('Error refreshing connection:', error);
      
      if (mounted.current) {
        setConnectionStatus('disconnected');
        toast.error(language === 'ar' 
          ? 'خطأ في إعادة الاتصال' 
          : 'Error refreshing connection');
      }
    } finally {
      if (mounted.current) {
        setIsRefreshing(false); // Use local state instead of setIsLoading
      }
    }
  };
  
  // Handle manual refresh of products
  const handleRefreshProducts = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent any form submission
    setIsRefreshing(true); // Use local state instead of setIsLoading
    
    try {
      retryCount.current = 0; // Reset retry counter
      
      await loadProducts(true); // Force refresh
      
      if (mounted.current) {
        setLastRefreshed(new Date());
        toast.success(language === 'ar' 
          ? 'تم تحديث المنتجات بنجاح' 
          : 'Products refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
      toast.error(language === 'ar' 
        ? 'فشل تحديث المنتجات، يرجى المحاولة مرة أخرى' 
        : 'Failed to refresh products, please try again');
    } finally {
      if (mounted.current) {
        setIsRefreshing(false); // Use local state instead of setIsLoading
      }
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {language === 'ar' ? 'تكامل متجر Shopify' : 'Shopify Store Integration'}
          </CardTitle>
          <Badge 
            variant={connectionStatus === 'connected' ? 'success' : 
                   connectionStatus === 'checking' ? 'outline' : 'destructive'}>
            {connectionStatus === 'connected' 
              ? (language === 'ar' ? 'متصل' : 'Connected')
              : connectionStatus === 'checking'
                ? (language === 'ar' ? 'جاري الفحص...' : 'Checking...')
                : (language === 'ar' ? 'غير متصل' : 'Disconnected')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {error || tokenError || isNetworkError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {language === 'ar' ? 'خطأ في الاتصال' : 'Connection Error'}
            </AlertTitle>
            <AlertDescription>
              {language === 'ar' 
                ? 'حدث خطأ في الاتصال بمتجر Shopify. يرجى المحاولة مرة أخرى أو التحقق من إعدادات الاتصال.'
                : 'There was an error connecting to your Shopify store. Please try again or check your connection settings.'}
            </AlertDescription>
          </Alert>
        ) : null}
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {language === 'ar' ? 'حالة المتجر:' : 'Store Status:'}
            </span>
            <span className="text-sm">
              {shopifyStore?.shop || (language === 'ar' ? 'غير متصل' : 'Not connected')}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {language === 'ar' ? 'عدد المنتجات:' : 'Products Count:'}
            </span>
            <span className="text-sm">
              {isLoading || isRefreshing
                ? <Loader2 className="h-3 w-3 animate-spin inline ml-2" /> 
                : productsCount}
            </span>
          </div>
          
          {lastRefreshed && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {language === 'ar' ? 'آخر تحديث:' : 'Last Refreshed:'}
              </span>
              <span className="text-sm">
                {lastRefreshed.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
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
              <ShoppingBag className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تحديث المنتجات' : 'Refresh Products'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ShopifyIntegration;
