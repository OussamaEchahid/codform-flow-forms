
import React, { useEffect, useState } from 'react';
import FormsPage from './FormsPage';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, Store } from 'lucide-react';
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
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [retries, setRetries] = useState(0);
  const maxRetries = 2;
  
  // Check connection once on load with improved reliability
  useEffect(() => {
    const checkConnection = async () => {
      if (isLoading || isValidating) return;
      
      try {
        setIsVerifying(true);
        
        // If there's no shop domain, redirect to connection page
        if (!shopDomain) {
          console.log('No shop domain found, redirecting to shopify connection page');
          toast.error('لا يوجد اتصال بمتجر Shopify. الرجاء الاتصال بمتجرك أولاً.');
          navigate('/shopify');
          return;
        }
        
        // Sync connection state first to ensure we have latest data
        await syncState();
        
        // If still not connected after syncState, redirect
        if (!isConnected) {
          console.log('Connection state sync complete but still not connected');
          toast.error('لا يوجد اتصال بمتجر Shopify. الرجاء الاتصال بمتجرك أولاً.');
          navigate('/shopify');
          return;
        }
        
        // Test the connection to make sure token is valid
        const isValid = await testConnection(true); // Force refresh to ensure we have current state
        
        if (!isValid && retries < maxRetries) {
          // Try one more time before giving up
          console.log(`Connection test failed, retrying (${retries + 1}/${maxRetries})`);
          setRetries(prev => prev + 1);
          
          // Wait a moment before retrying
          setTimeout(checkConnection, 1000);
          return;
        }
        
        if (!isValid) {
          console.log('Connection test failed, redirecting to settings to update token');
          toast.error('رمز الوصول إلى Shopify غير صالح أو منتهي الصلاحية. الرجاء تحديث رمز الوصول.');
          navigate('/settings');
        } else {
          // Reset retries when successful
          setRetries(0);
          console.log('Connection verified successfully');
        }
      } catch (error) {
        console.error('Error verifying connection:', error);
        toast.error('حدث خطأ أثناء التحقق من الاتصال');
      } finally {
        setIsVerifying(false);
      }
    };
    
    checkConnection();
  }, [isConnected, shopDomain, isLoading, isValidating, navigate, syncState, testConnection, retries]);
  
  // Show loading state
  if (isLoading || isValidating || isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">جاري التحقق من اتصال Shopify...</p>
        {retries > 0 && (
          <p className="text-xs text-gray-400 mt-2">محاولة {retries}/{maxRetries}</p>
        )}
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
            onClick={() => navigate('/settings')}
          >
            تحديث رمز الوصول
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
