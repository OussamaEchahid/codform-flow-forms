
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
    manualReconnect,
    isConnected: shopifyIsConnected 
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
  
  // Combine all connection indicators to determine real connection status
  const isActuallyConnected = shopifyConnected && shop && shopifyIsConnected;
  
  // Initial connection check when component loads - always force a re-check
  useEffect(() => {
    console.log("ShopifyIntegration component mounted");
    const checkConnection = () => {
      console.log("Checking connection status:", { 
        shopifyConnected, 
        shop, 
        shopifyIsConnected,
        isActuallyConnected: shopifyConnected && shop && shopifyIsConnected 
      });
      
      if (isActuallyConnected) {
        console.log("Shopify connection confirmed:", shop);
        setConnectionStatus('success');
        setForceShowConnectWarning(false); // Hide warning when connected
      } else {
        console.log("Incomplete Shopify connection detected, showing warning");
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
  }, [shopifyConnected, shop, shopifyIsConnected]);
  
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
    } else if (isActuallyConnected) {
      setConnectionStatus('success');
      setForceShowConnectWarning(false); // Hide warning when connected
    }
  }, [shopifyError, shopifyConnected, shop, shopifyIsConnected]);

  const handleSave = async () => {
    if (isRedirecting || localIsRedirecting) {
      toast.error(language === 'ar' 
        ? 'يرجى الانتظار حتى تكتمل عملية إعادة الاتصال'
        : 'Please wait until reconnection is complete');
      return;
    }
    
    if (!isActuallyConnected) {
      toast.error(language === 'ar' 
        ? 'يجب عليك الاتصال بـ Shopify أولاً'
        : 'You need to connect to Shopify first');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError(null);
      
      // Validate blockId - ensure it's not empty and contains only valid characters
      if (!blockId || blockId.trim() === '') {
        const newBlockId = `codform-${Math.random().toString(36).substring(2, 8)}`;
        setBlockId(newBlockId);
        toast.info(language === 'ar'
          ? `تم إنشاء معرف مكون تلقائي: ${newBlockId}`
          : `Auto-generated block ID: ${newBlockId}`);
      }
      
      // Ensure the blockId is properly formatted - no spaces, only letters, numbers, and hyphens
      const cleanedBlockId = blockId.trim().replace(/[^a-zA-Z0-9-]/g, '-');
      if (cleanedBlockId !== blockId) {
        setBlockId(cleanedBlockId);
      }
      
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
          blockId: cleanedBlockId
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
  
  // Modified manual reconnect function to prevent redirect loops
  const handleManualReconnect = () => {
    // Prevent multiple clicks
    if (isRedirecting || localIsRedirecting) {
      toast.info(language === 'ar' 
        ? 'جاري بالفعل إعادة التوجيه، يرجى الانتظار...'
        : 'Already redirecting, please wait...');
      return;
    }
    
    setLocalIsRedirecting(true);
    
    // Use the manualReconnect function from useShopify if available
    if (manualReconnect && typeof manualReconnect === 'function') {
      const success = manualReconnect();
      if (!success) {
        setLocalIsRedirecting(false);
      }
    } else {
      // Clear stored connection data
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_reconnect_attempts');
      localStorage.removeItem('shopify_last_connect_time');
      localStorage.removeItem('shopify_last_redirect_time');
      localStorage.removeItem('shopify_temp_store');
      
      // Update auth context if available
      if (refreshShopifyConnection) {
        refreshShopifyConnection();
      }
      
      // Show message to user
      toast.info(language === 'ar' 
        ? 'جاري إعادة توجيهك للاتصال بـ Shopify...'
        : 'Redirecting to connect to Shopify...');
      
      // Add a longer delay to prevent rapid redirections
      setTimeout(() => {
        console.log("Redirecting to Shopify connection page...");
        // Use direct path for more reliable navigation
        window.location.href = '/shopify?reconnect=true&ts=' + Date.now();
      }, 1500);
    }
  };

  // Show a warning if Shopify is not connected
  if (!isActuallyConnected || forceShowConnectWarning) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {language === 'ar' 
              ? 'غير متصل بـ Shopify' 
              : 'Not Connected to Shopify'}
          </AlertTitle>
          <AlertDescription>
            {language === 'ar' 
              ? 'يجب أن تكون متصلاً بمتجر Shopify لاستخدام هذه الميزة.' 
              : 'You must be connected to a Shopify store to use this feature.'}
          </AlertDescription>
        </Alert>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>
              {language === 'ar' 
                ? 'اتصال بـ Shopify' 
                : 'Shopify Connection'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'قم بالاتصال بمتجر Shopify الخاص بك للبدء.' 
                : 'Connect to your Shopify store to get started.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <img 
              src="https://cdn.shopify.com/s/files/1/0558/6737/1846/files/shopify_logo_whitebg.png" 
              alt="Shopify Logo" 
              className="mb-4 w-40 h-auto" 
            />
            <p className="text-center mb-6">
              {language === 'ar' 
                ? 'يتيح لك الاتصال بـ Shopify دمج النماذج مع متجرك، وعرض المنتجات، وتخصيص الردود على الطلبات.' 
                : 'Connecting to Shopify allows you to integrate forms with your store, display products, and customize order responses.'}
            </p>
            <Button 
              onClick={handleManualReconnect}
              className="bg-[#95BF47] hover:bg-[#7AA93C] text-white w-full max-w-xs"
              disabled={isRedirecting || localIsRedirecting}
            >
              {isRedirecting || localIsRedirecting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ar' 
                    ? 'جاري التوجيه...' 
                    : 'Redirecting...'}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {language === 'ar' 
                    ? 'الاتصال بـ Shopify' 
                    : 'Connect to Shopify'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rest of the component for the connected state
  return (
    <div className="max-w-4xl mx-auto">
      <Alert className="mb-6 bg-green-50 border-green-200">
        <Check className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">
          {language === 'ar' 
            ? 'متصل بـ Shopify' 
            : 'Connected to Shopify'}
        </AlertTitle>
        <AlertDescription className="text-green-700">
          {language === 'ar' 
            ? `متصل حاليا بمتجر: ${shop}` 
            : `Currently connected to store: ${shop}`}
        </AlertDescription>
      </Alert>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>
            {language === 'ar' 
              ? 'إعدادات تكامل المتجر' 
              : 'Store Integration Settings'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'قم بتخصيص كيفية ظهور النموذج في متجرك' 
              : 'Customize how the form appears in your store'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium">
              {language === 'ar' 
                ? 'مكان عرض النموذج' 
                : 'Form Display Location'}
            </label>
            <Select 
              value={position} 
              onValueChange={(val) => setPosition(val as any)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={
                  language === 'ar' 
                    ? 'اختر مكان العرض' 
                    : 'Select display location'
                } />
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
            <p className="text-xs text-gray-500 mt-1">
              {language === 'ar' 
                ? 'يحدد أين سيظهر النموذج في متجرك.' 
                : 'Determines where the form will appear in your store.'}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium">
              {language === 'ar' 
                ? 'معرف المكوّن (Block ID)' 
                : 'Block ID'}
            </label>
            <input
              type="text"
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder={language === 'ar' ? 'أدخل معرف المكون' : 'Enter block ID'}
            />
            <p className="text-xs text-gray-500 mt-1">
              {language === 'ar' 
                ? 'معرف فريد يستخدم لإدراج النموذج في الصفحة.' 
                : 'A unique identifier used to embed the form in the page.'}
            </p>
          </div>
          
          {/* Display Products - temporarily disabled until Shopify API is fixed */}
          <div className="pt-2 opacity-75 cursor-not-allowed">
            <div className="pointer-events-none">
              <label className="text-sm font-medium flex items-center">
                <span>
                  {language === 'ar' 
                    ? 'المنتجات المرتبطة (قريبًا)' 
                    : 'Associated Products (Coming Soon)'}
                </span>
                <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded ml-2">
                  {language === 'ar' ? 'قريبًا' : 'Soon'}
                </div>
              </label>
              <Select disabled value="all">
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={
                    language === 'ar' 
                      ? 'جميع المنتجات' 
                      : 'All Products'
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'ar' ? 'جميع المنتجات' : 'All Products'}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar' 
                  ? 'ميزة قادمة قريبًا - انتظرها!' 
                  : 'Coming soon feature - stay tuned!'}
              </p>
            </div>
          </div>
          
          {saveError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطأ</AlertTitle>
              <AlertDescription>
                {saveError}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between flex-wrap gap-4">
          <Button 
            variant="outline"
            onClick={handleManualReconnect}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {language === 'ar' 
              ? 'إعادة الاتصال' 
              : 'Reconnect'}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isSyncing}
            className="bg-[#9b87f5] hover:bg-[#8a74e8]"
          >
            {(isSaving || isSyncing) ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {language === 'ar' 
                  ? 'جاري الحفظ...' 
                  : 'Saving...'}
              </>
            ) : (
              language === 'ar' 
                ? 'حفظ الإعدادات' 
                : 'Save Settings'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ShopifyIntegration;
