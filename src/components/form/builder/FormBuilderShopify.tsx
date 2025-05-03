
import React, { useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ShopifyFormData } from '@/lib/shopify/types';
import { useShopify } from '@/hooks/useShopify';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FormBuilderShopifyProps {
  onShopifyIntegration?: (settings: ShopifyFormData) => Promise<void>;
  isSyncing?: boolean;
  formId?: string | null;
}

const FormBuilderShopify: React.FC<FormBuilderShopifyProps> = ({ 
  onShopifyIntegration, 
  isSyncing = false,
  formId = null
}) => {
  const { t, language } = useI18n();
  const { isConnected, manualReconnect, refreshConnection } = useShopify();
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  
  // Use refs to track checking state
  const lastCheckTimeRef = useRef<number>(0);
  const CONNECTION_THROTTLE = 60000; // 60 seconds minimum between checks
  
  // Improved connection checking with throttling
  const handleCheckConnection = async () => {
    if (!refreshConnection || isCheckingConnection) return;
    
    const now = Date.now();
    
    // Throttle connection checks
    if (now - lastCheckTimeRef.current < CONNECTION_THROTTLE) {
      toast.info(
        language === 'ar' 
          ? 'الرجاء الانتظار قبل التحقق مرة أخرى' 
          : 'Please wait before checking again'
      );
      return;
    }
    
    setIsCheckingConnection(true);
    
    try {
      const connected = await refreshConnection();
      lastCheckTimeRef.current = Date.now();
      
      if (connected !== undefined) {
        toast.success(connected
          ? (language === 'ar' ? 'تم التحقق من اتصال Shopify بنجاح' : 'Shopify connection verified successfully')
          : (language === 'ar' ? 'فشل التحقق من اتصال Shopify' : 'Shopify connection verification failed')
        );
      }
    } catch (error) {
      console.error('خطأ في التحقق من الاتصال:', error);
      toast.error(language === 'ar' ? 'خطأ في التحقق من الاتصال' : 'Connection check error');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleConnectClick = () => {
    if (!isConnected && manualReconnect) {
      manualReconnect();
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-medium text-lg mb-2">{t('shopify.integration') || 'Shopify Integration'}</h3>
      
      {!isConnected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">
              {t('shopify.connection_required') || 
              'You need to connect to Shopify to use this feature.'}
            </p>
          </div>
          <Button 
            onClick={handleConnectClick}
            className="w-full"
            disabled={isSyncing}
            type="button"
          >
            {t('shopify.connect_now') || 'Connect to Shopify'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-600">
              {t('shopify.connected') || 'Connected to Shopify'}
            </p>
          </div>
          
          {/* Connection verification button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleCheckConnection}
              disabled={isCheckingConnection}
              type="button"
            >
              {isCheckingConnection ? (
                <>
                  <div className="animate-spin mr-1 h-3 w-3 border-t-2 border-b-2 border-current rounded-full" />
                  {language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  {language === 'ar' ? 'التحقق من الاتصال' : 'Verify Connection'}
                </>
              )}
            </Button>
          </div>

          {formId && (
            <div className="bg-gray-50 p-3 rounded-md mt-2">
              <p className="text-sm text-gray-600">
                {language === 'ar' 
                  ? `النموذج رقم: ${formId} جاهز للتكامل مع متجرك`
                  : `Form ID: ${formId} ready for integration with your store`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormBuilderShopify;
