
import React, { useEffect } from 'react';
import FormsPage from './FormsPage';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Forms = () => {
  const navigate = useNavigate();
  const { 
    isConnected, 
    shopDomain, 
    isLoading,
    isValidating, 
    error,
    syncState,
    testConnection
  } = useShopifyConnection();
  
  // Check connection once on load
  useEffect(() => {
    const checkConnection = async () => {
      if (isLoading || isValidating) return;
      
      if (!isConnected && !shopDomain) {
        toast.error('لا يوجد اتصال بمتجر Shopify. الرجاء الاتصال بمتجرك أولاً.');
        navigate('/shopify');
        return;
      }
      
      // Make sure connection state is up to date
      syncState();
      
      // Also test the connection to make sure token is valid
      // Pass false explicitly to avoid the TypeScript error
      const isValid = await testConnection(false);
      
      if (!isValid) {
        toast.error('رمز الوصول إلى Shopify غير صالح أو منتهي الصلاحية. الرجاء تحديث رمز الوصول.');
      }
    };
    
    checkConnection();
  }, [isConnected, shopDomain, isLoading, isValidating, navigate, syncState, testConnection]);
  
  // Show loading state
  if (isLoading || isValidating) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">جاري التحقق من اتصال Shopify...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertTriangle className="h-4 w-4 ml-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="flex gap-2 mt-4">
          <Button 
            onClick={() => navigate('/shopify')}
          >
            الاتصال بـ Shopify
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    );
  }

  // All good - show the forms page with the shop domain
  return <FormsPage shopId={shopDomain || ''} />;
};

export default Forms;
