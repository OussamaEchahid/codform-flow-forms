
import React, { useEffect, useState } from 'react';
import { useShopify } from '@/hooks/useShopify';
import { ShopifyFormData } from '@/lib/shopify/types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

interface ShopifyConnectionManagerProps {
  formId: string | null;
  onShopifyIntegration?: (settings: ShopifyFormData) => Promise<void>;
}

/**
 * ShopifyConnectionManager component handles Shopify connection monitoring
 * and prevents excessive requests
 */
const ShopifyConnectionManager: React.FC<ShopifyConnectionManagerProps> = ({
  formId,
  onShopifyIntegration
}) => {
  const { verifyShopifyConnection, connectionStatus, manualReconnect, isConnected, shop } = useShopify();
  const [isChecking, setIsChecking] = useState(false);
  const [shouldShowErrors, setShouldShowErrors] = useState(false);
  const { language } = useI18n();

  // Single connection check on mount
  useEffect(() => {
    let isMounted = true;
    
    // Check connection once when component mounts
    const checkOnce = async () => {
      try {
        await verifyShopifyConnection();
        
        // Only show errors after initial check to prevent unnecessary alerts
        if (isMounted) {
          setTimeout(() => {
            setShouldShowErrors(true);
          }, 3000);
        }
      } catch (error) {
        console.error('Error during initial connection check:', error);
      }
    };
    
    if (isConnected && shop) {
      checkOnce();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isConnected, shop, verifyShopifyConnection]);

  const handleCheckConnection = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const result = await verifyShopifyConnection();
      if (result) {
        toast.success(language === 'ar' ? 'تم التحقق من الاتصال بنجاح' : 'Connection verified successfully');
      } else {
        toast.error(language === 'ar' ? 'فشل التحقق من الاتصال' : 'Connection verification failed');
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء التحقق من الاتصال' : 'Error checking connection');
    } finally {
      setIsChecking(false);
    }
  };

  // Don't show anything if there's no warning or we haven't done the initial check
  if (!shouldShowErrors || connectionStatus || !isConnected) {
    return null;
  }

  return (
    <Alert className="bg-red-50 text-red-800 border-red-300 mb-4">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="flex justify-between items-center">
        <span>
          {language === 'ar' 
            ? 'يبدو أن هناك مشكلة في الاتصال مع Shopify. قد يؤثر هذا على بعض الميزات.' 
            : 'There appears to be a Shopify connection issue. This may affect some features.'}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-300"
            onClick={handleCheckConnection}
            disabled={isChecking}
          >
            {isChecking && (
              <span className="h-4 w-4 mr-1 border-2 border-t-red-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></span>
            )}
            {language === 'ar' ? 'تحقق' : 'Check'}
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700"
            onClick={manualReconnect}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            {language === 'ar' ? 'إعادة اتصال' : 'Reconnect'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ShopifyConnectionManager;
