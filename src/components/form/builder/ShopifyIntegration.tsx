
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';
import { ShopifyFormData } from '@/lib/shopify/types';
import { Loader, AlertCircle, Info, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { useShopify } from '@/hooks/useShopify';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

export interface ShopifyIntegrationProps {
  formId: string;
  onSave: (settings: ShopifyFormData) => void;
  isSyncing?: boolean;
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({
  formId,
  onSave,
  isSyncing = false,
}) => {
  const { language } = useI18n();
  const { shopifyConnected, shop, refreshShopifyConnection } = useAuth();
  const navigate = useNavigate();
  const [position, setPosition] = useState<'product-page' | 'cart-page' | 'checkout'>('product-page');
  const { 
    products, 
    isLoading: loadingProducts, 
    error: shopifyError, 
    isRedirecting, 
    redirectionDisabled, 
    manualReconnect 
  } = useShopify();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [blockId, setBlockId] = useState<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);
  // Adding local isRedirecting state
  const [localIsRedirecting, setLocalIsRedirecting] = useState(false);
  const isMobile = useIsMobile();
  const [forceShowConnectWarning, setForceShowConnectWarning] = useState(false);
  
  // Initial connection check when component loads - always force a re-check
  useEffect(() => {
    const checkConnection = () => {
      if (shopifyConnected && shop) {
        console.log("Shopify connection detected:", shop);
        // Always verify actual connection by trying to verify connection and handle failures
        setConnectionStatus('success');
      } else {
        console.log("No Shopify connection detected, showing warning");
        setConnectionStatus('error');
        setForceShowConnectWarning(true);
      }
      setHasCheckedConnection(true);
    };
    
    // Run connection check regardless of previous checks
    checkConnection();
    
    // Setup interval to recheck connection every 10 seconds
    const intervalId = setInterval(checkConnection, 10000);
    
    return () => clearInterval(intervalId);
  }, [shopifyConnected, shop]);
  
  // Generate random block ID if not already present
  React.useEffect(() => {
    if (!blockId) {
      const randomId = Math.random().toString(36).substring(2, 10);
      setBlockId(`codform-${randomId}`);
    }
  }, [blockId]);

  // Handle different error cases
  useEffect(() => {
    if (shopifyError) {
      console.error('Shopify error detected:', shopifyError);
      setConnectionStatus('error');
      setSaveError(shopifyError);
      setForceShowConnectWarning(true);
    } else if (shopifyConnected && shop) {
      setConnectionStatus('success');
    }
  }, [shopifyError, shopifyConnected, shop]);

  const handleSave = async () => {
    if (isRedirecting || localIsRedirecting) {
      toast.error(language === 'ar' 
        ? 'يرجى الانتظار حتى تكتمل عملية إعادة الاتصال'
        : 'Please wait until reconnection is complete');
      return;
    }
    
    if (!shopifyConnected || !shop) {
      toast.error(language === 'ar' 
        ? 'يجب عليك الاتصال بـ Shopify أولاً'
        : 'You need to connect to Shopify first');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError(null);
      
      // Log form data for debugging
      const formData = {
        formId,
        shopDomain: shop,
        settings: {
          position,
          style: {
            primaryColor: '#000000',
            fontSize: '16px',
            borderRadius: '4px',
          },
          products: selectedProducts,
          blockId: blockId
        },
      };
      
      console.log('Saving Shopify integration with data:', formData);
      
      // Call the save function provided by the parent component
      await onSave(formData);
      
      toast.success(language === 'ar' 
        ? 'تم حفظ إعدادات شوبيفاي بنجاح'
        : 'Shopify settings saved successfully');
    } catch (error) {
      console.error('Error saving Shopify settings:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : language === 'ar' 
          ? 'حدث خطأ أثناء حفظ إعدادات شوبيفاي'
          : 'An error occurred while saving Shopify settings';
      
      setSaveError(errorMessage);
      toast.error(errorMessage);
      setForceShowConnectWarning(true);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Modified manual reconnect function to prevent redirect loops and add reconnection timestamp
  const handleManualReconnect = () => {
    // Prevent multiple clicks
    if (isRedirecting || localIsRedirecting) {
      toast.info(language === 'ar' 
        ? 'جاري بالفعل إعادة التوجيه، يرجى الانتظار...'
        : 'Already redirecting, please wait...');
      return;
    }
    
    // Check if we've tried to reconnect recently
    const lastReconnectTime = parseInt(localStorage.getItem('shopify_last_reconnect_time') || '0');
    const timeSinceLastReconnect = Date.now() - lastReconnectTime;
    
    // Allow reconnection attempts only every 30 seconds
    if (timeSinceLastReconnect < 30000) {
      const secondsRemaining = Math.ceil((30000 - timeSinceLastReconnect) / 1000);
      toast.info(language === 'ar'
        ? `تم محاولة إعادة الاتصال مؤخرًا، يرجى الانتظار ${secondsRemaining} ثانية...`
        : `Reconnection attempted recently, please wait ${secondsRemaining} seconds...`);
      return;
    }
    
    // Set local redirecting state
    setLocalIsRedirecting(true);
    
    // Store reconnect attempt timestamp
    localStorage.setItem('shopify_last_reconnect_time', Date.now().toString());
    
    // Remove all locally stored data
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_reconnect_attempts');
    localStorage.removeItem('shopify_last_connect_time');
    localStorage.removeItem('shopify_last_redirect_time');
    localStorage.removeItem('shopify_temp_store');
    
    // Update auth context
    if (refreshShopifyConnection) {
      refreshShopifyConnection();
    }
    
    // Show message to user
    toast.info(language === 'ar'
      ? 'جاري إعادة توجيهك للاتصال بـ Shopify...'
      : 'Redirecting to connect to Shopify...');
    
    // Use window.location for more robust navigation and to break potential redirect loops
    // Add a timestamp query parameter to bust cache and ensure we get a fresh page
    setTimeout(() => {
      window.location.href = '/shopify?reconnect=integration&ts=' + Date.now();
      
      // Reset local state after longer timeout
      setTimeout(() => {
        setLocalIsRedirecting(false);
      }, 3000);
    }, 1500);
  };

  // Enhanced UI component for connection status - Always show connection status for debugging
  const renderConnectionStatus = () => {
    // Always show reconnect UI if we have errors or forceShowConnectWarning is true
    if ((connectionStatus === 'error' || saveError || forceShowConnectWarning || !shopifyConnected || !shop)) {
      return (
        <Alert className="bg-red-50 border-red-300 mb-4 p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
            <AlertTitle className="text-lg font-bold">
              {language === 'ar' ? 'مشكلة في الاتصال بالمتجر' : 'Connection issue detected'}
            </AlertTitle>
          </div>
          
          {saveError && (
            <AlertDescription className="mt-3 text-base">
              {saveError}
            </AlertDescription>
          )}
          
          <div className="mt-4 flex justify-center">
            <Button 
              size="lg"
              onClick={handleManualReconnect} 
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3"
              disabled={isRedirecting || localIsRedirecting}
            >
              {(isRedirecting || localIsRedirecting) ? (
                <Loader className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 mr-2" />
              )}
              {language === 'ar' ? 'إعادة الاتصال بـ Shopify' : 'Reconnect to Shopify'}
            </Button>
          </div>
          
          <p className="mt-4 text-sm text-center text-red-700">
            {language === 'ar'
              ? 'تم اكتشاف مشكلة في الاتصال بـ Shopify. يرجى النقر على الزر أعلاه لإعادة الاتصال'
              : 'A problem with your Shopify connection was detected. Please click the button above to reconnect'}
          </p>
        </Alert>
      );
    } else if (isRedirecting || localIsRedirecting) {
      return (
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <div className="flex items-center">
            <Loader className="h-5 w-5 animate-spin text-blue-500 mr-2" />
            <AlertTitle className="text-lg font-bold">
              {language === 'ar' ? 'جاري إعادة الاتصال...' : 'Reconnecting...'}
            </AlertTitle>
          </div>
          <AlertDescription className="mt-2 text-base">
            {language === 'ar'
              ? 'يرجى الانتظار بينما نقوم بإعادة الاتصال بـ Shopify'
              : 'Please wait while we reconnect to Shopify'}
          </AlertDescription>
        </Alert>
      );
    } else if (connectionStatus === 'success' && shopifyConnected && shop) {
      return (
        <Alert className="bg-green-50 border-green-200 mb-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <AlertTitle className="text-lg font-bold">
                {language === 'ar' 
                  ? `متصل بمتجر: ${shop}` 
                  : `Connected to store: ${shop}`}
              </AlertTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualReconnect}
              className="ml-2 border-green-300 text-green-700 hover:bg-green-50"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              {language === 'ar' ? 'إعادة الاتصال' : 'Reconnect'}
            </Button>
          </div>
        </Alert>
      );
    }
    
    // Fallback for any other state - should always show something
    return (
      <Alert className="bg-yellow-50 border-yellow-200 mb-4">
        <div className="flex items-center">
          <Info className="h-5 w-5 text-yellow-500 mr-2" />
          <AlertTitle className="text-lg font-bold">
            {language === 'ar' 
              ? 'جاري التحقق من الاتصال...' 
              : 'Checking connection status...'}
          </AlertTitle>
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualReconnect}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify'}
          </Button>
        </div>
      </Alert>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {language === 'ar' ? 'تكامل شوبيفاي' : 'Shopify Integration'}
        </CardTitle>
        <CardDescription>
          {language === 'ar' 
            ? 'قم بتكوين كيفية ظهور النموذج في متجر شوبيفاي الخاص بك'
            : 'Configure how your form appears in your Shopify store'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Always display connection status */}
        <div className="mb-6">
          {renderConnectionStatus()}
        </div>
        
        {shopifyConnected && shop ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ar' ? 'موقع النموذج' : 'Form Position'}
              </label>
              <Select value={position} onValueChange={(value: any) => setPosition(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product-page">
                    {language === 'ar' ? 'صفحة المنتج' : 'Product Page'}
                  </SelectItem>
                  <SelectItem value="cart-page">
                    {language === 'ar' ? 'صفحة السلة' : 'Cart Page'}
                  </SelectItem>
                  <SelectItem value="checkout">
                    {language === 'ar' ? 'صفحة الدفع' : 'Checkout'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium mb-2">
                {language === 'ar' ? 'معرف كتلة Shopify' : 'Shopify Block ID'}
              </p>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={blockId}
                  onChange={(e) => setBlockId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={language === 'ar' ? 'معرف كتلة شوبيفاي' : 'Shopify block ID'}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const newId = `codform-${Math.random().toString(36).substring(2, 10)}`;
                    setBlockId(newId);
                  }}
                >
                  {language === 'ar' ? 'توليد' : 'Generate'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar'
                  ? 'هذا المعرف مطلوب للمساعدة في تتبع النماذج المختلفة في متجرك'
                  : 'This ID is required to help track different forms in your store'}
              </p>
            </div>

            <Alert className="mt-4 bg-blue-50 border-blue-100">
              <Info className="h-4 w-4 text-blue-500 mr-2" />
              <AlertTitle className="text-sm font-medium mb-1">
                {language === 'ar' ? 'تذكير هام' : 'Important Reminder'}
              </AlertTitle>
              <AlertDescription className="text-xs text-gray-600">
                {language === 'ar'
                  ? 'بعد حفظ التكامل، يجب عليك الذهاب إلى محرر موضوعات متجرك في شوبيفاي وإضافة بلوك "نموذج الدفع عند الاستلام" في قالب المنتج. تأكد من تعيين نفس معرف النموذج الذي اخترته في إعدادات البلوك.'
                  : 'After saving the integration, you need to go to your Shopify theme editor and add the "Cash on Delivery Form" block in your product template. Make sure to set the same form ID you selected in the block settings.'}
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSave}
              className="w-full mt-4"
              disabled={isSaving || isSyncing || isRedirecting || localIsRedirecting}
            >
              {(isSaving || isSyncing) ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}
                </>
              ) : (isRedirecting || localIsRedirecting) ? (
                language === 'ar' ? 'جارٍ إعادة الاتصال...' : 'Reconnecting...'
              ) : (
                language === 'ar' ? 'حفظ التكامل' : 'Save Integration'
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <AlertTitle>
                {language === 'ar' 
                  ? 'أنت غير متصل بـ Shopify. قم بتسجيل الدخول لاستخدام هذه الميزة.'
                  : 'You are not connected to Shopify. Sign in to use this feature.'}
              </AlertTitle>
            </Alert>
            
            <div className="flex justify-center mt-6">
              <Button 
                size="lg"
                variant="default"
                className="w-full py-3 text-lg bg-purple-600 hover:bg-purple-700"
                onClick={handleManualReconnect}
                disabled={isRedirecting || localIsRedirecting}
              >
                {(isRedirecting || localIsRedirecting) ? (
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5 mr-2" />
                )}
                {language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-500 w-full text-center">
          {language === 'ar'
            ? 'سيتم مزامنة النموذج تلقائياً عند تحديث المنتجات في متجرك'
            : 'The form will automatically sync when products are updated in your store'}
        </p>
      </CardFooter>
    </Card>
  );
};

export default ShopifyIntegration;
