
import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useShopify } from '@/hooks/useShopify';
import { RefreshCcw, AlertCircle, CheckCircle, Store } from 'lucide-react';
import { toast } from 'sonner';
import { ShopifyConnectionManager } from '@/utils/shopifyConnectionManager';
import { Input } from '@/components/ui/input';

interface FormBuilderShopifyProps {
  onShopifyIntegration?: (settings: any) => Promise<void>;
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);
  const hasAttemptedConnection = useRef(false);
  const [shopDomain, setShopDomain] = useState('');
  
  // Load any existing temporary store when component mounts
  useEffect(() => {
    const tempStore = ShopifyConnectionManager.getCurrentStoreTarget();
    if (tempStore) {
      setShopDomain(tempStore);
    }
  }, []);
  
  // Connection checking with throttling
  const handleCheckConnection = async () => {
    if (!refreshConnection || isCheckingConnection) return;
    
    // Prevent too frequent checks
    const now = Date.now();
    if (now - lastAttemptTime < 5000) { // 5 seconds minimum between checks
      toast.info(language === 'ar' 
        ? 'الرجاء الانتظار قبل التحقق مرة أخرى' 
        : 'Please wait before checking again');
      return;
    }
    
    setIsCheckingConnection(true);
    setLastAttemptTime(now);
    
    try {
      const connected = await refreshConnection();
      
      if (connected !== undefined) {
        toast.success(connected
          ? (language === 'ar' ? 'تم التحقق من اتصال Shopify بنجاح' : 'Shopify connection verified successfully')
          : (language === 'ar' ? 'فشل التحقق من اتصال Shopify' : 'Shopify connection verification failed')
        );
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      toast.error(language === 'ar' ? 'خطأ في التحقق من الاتصال' : 'Connection check error');
    } finally {
      setTimeout(() => {
        setIsCheckingConnection(false);
      }, 1000);
    }
  };

  const handleConnectClick = () => {
    // Check if we have a shop domain
    if (!shopDomain) {
      toast.error(language === 'ar' 
        ? 'يرجى إدخال اسم المتجر' 
        : 'Please enter a shop domain');
      return;
    }
    
    // Check if we're already connecting
    if (isConnecting) {
      return;
    }
    
    // Check if we should throttle connection attempts
    if (ShopifyConnectionManager.shouldThrottle()) {
      const timeToWait = ShopifyConnectionManager.getTimeToWait();
      
      toast.info(language === 'ar' 
        ? `يرجى الانتظار ${Math.ceil(timeToWait/1000)} ثوانٍ قبل إعادة المحاولة` 
        : `Please wait ${Math.ceil(timeToWait/1000)} seconds before trying again`);
      return;
    }
    
    // Record this attempt and mark as attempted
    ShopifyConnectionManager.recordAttempt();
    hasAttemptedConnection.current = true;
    setIsConnecting(true);
    setLastAttemptTime(Date.now());
    
    // Save the store domain as the temporary target
    ShopifyConnectionManager.setTempStore(shopDomain);
    
    try {
      // Use the provided reconnect function with our shop domain
      const clientUrl = window.location.origin;
      const redirectUrl = `/auth?shop=${encodeURIComponent(shopDomain)}&timestamp=${Date.now()}&client=${encodeURIComponent(clientUrl)}`;
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Error initiating Shopify connection:', err);
      toast.error(language === 'ar' ? 'خطأ في الاتصال بـ Shopify' : 'Error connecting to Shopify');
      setTimeout(() => {
        setIsConnecting(false);
      }, 1000);
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
          
          <div className="space-y-2">
            <div>
              <label htmlFor="formShopDomain" className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'ar' ? 'اسم المتجر' : 'Shop Domain'}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="formShopDomain"
                  placeholder="your-store.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  className="flex-1"
                  disabled={isConnecting}
                />
                <Button 
                  onClick={handleConnectClick}
                  disabled={isSyncing || isConnecting || !shopDomain}
                  type="button"
                  className="whitespace-nowrap"
                >
                  {isConnecting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري الاتصال...' : 'Connecting...'}
                    </div>
                  ) : (
                    <>
                      <Store className="h-4 w-4 mr-1" />
                      {t('shopify.connect_now') || 'Connect'}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar' 
                  ? 'أدخل اسم متجر Shopify الخاص بك (مثال: your-store.myshopify.com)'
                  : 'Enter your Shopify store domain (e.g., your-store.myshopify.com)'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-600">
              {t('shopify.connected') || 'Connected to Shopify'}
            </p>
          </div>
          
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
                  <RefreshCcw className="mr-1 h-3 w-3" />
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
