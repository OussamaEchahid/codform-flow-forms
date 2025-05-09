
import React, { useEffect } from 'react';
import FormsPage from './FormsPage';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { Button } from '@/components/ui/button';
import ConnectionErrorHandler from '@/components/shopify/ConnectionErrorHandler';

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
      
      // Test the connection with a single parameter
      try {
        const isValid = await testConnection(true);
        
        if (!isValid) {
          console.warn('Token validation failed in Forms page');
        }
      } catch (testError) {
        console.error('Error testing connection in Forms page:', testError);
      }
    };
    
    checkConnection();
  }, [isConnected, shopDomain, isLoading, isValidating, navigate, syncState, testConnection]);

  // Logic to retry connection and continue to FormsPage
  const handleRetrySuccess = () => {
    // If retry is successful, simply remain on the page
    // The component will rerender with updated connection state
  };
  
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
      <div className="flex flex-col items-center justify-center h-screen max-w-md mx-auto">
        <ConnectionErrorHandler 
          onRetrySuccess={handleRetrySuccess}
          showReconnectButton={true}
          showResetButton={true}
          className="w-full"
        />
        
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
