
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
import { supabase } from '@/integrations/supabase/client';

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
    verifyShopifyConnection,
    connectionStatus
  } = useShopify();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [blockId, setBlockId] = useState<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionState, setConnectionState] = useState<'checking' | 'success' | 'error'>('checking');
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);
  
  // Adding local isRedirecting state
  const [localIsRedirecting, setLocalIsRedirecting] = useState(false);
  const isMobile = useIsMobile();
  
  // Initial connection check when component loads with direct verification
  useEffect(() => {
    console.log("ShopifyIntegration component mounted");
    const checkDbConnection = async () => {
      console.log("Checking database connection status");
      setConnectionState('checking');
      
      if (!shopifyConnected || !shop) {
        console.log("No shopifyConnected or shop in auth state");
        setConnectionState('error');
        setHasCheckedConnection(true);
        return;
      }
      
      try {
        // Check if token exists in database
        const { data: storeData, error: storeError } = await supabase
          .from('shopify_stores')
          .select('access_token')
          .eq('shop', shop)
          .single();
        
        if (storeError || !storeData || !storeData.access_token) {
          console.log("Database check: No valid token found", { storeError });
          setConnectionState('error');
          setHasCheckedConnection(true);
          return;
        }
        
        // If token exists, verify API connection
        const isApiConnected = await verifyShopifyConnection();
        console.log("API connection verification result:", isApiConnected);
        
        setConnectionState(isApiConnected ? 'success' : 'error');
      } catch (error) {
        console.error("Error checking connection:", error);
        setConnectionState('error');
      }
      
      setHasCheckedConnection(true);
    };
    
    checkDbConnection();
  }, [shop, shopifyConnected, verifyShopifyConnection]);
  
  // Generate random block ID if not already present
  React.useEffect(() => {
    if (!blockId) {
      // Generate a more readable and consistent block ID format
      const randomId = `codform-${Math.random().toString(36).substring(2, 8)}`;
      console.log('Generated default block ID:', randomId);
      setBlockId(randomId);
    }
  }, [blockId]);

  // Handle different error cases
  useEffect(() => {
    if (shopifyError) {
      console.error('Shopify error detected:', shopifyError);
      setConnectionState('error');
      setSaveError(shopifyError);
    }
  }, [shopifyError]);

  const handleSave = async () => {
    // Prevent save if redirecting
    if (isRedirecting || localIsRedirecting) {
      toast.error(language === 'ar' 
        ? 'يرجى الانتظار حتى تكتمل عملية إعادة الاتصال'
        : 'Please wait until reconnection is complete');
      return;
    }
    
    // Prevent save if not connected
    if (connectionState !== 'success' || !shopifyConnected || !shop) {
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
      let cleanedBlockId = blockId.trim().replace(/[^a-zA-Z0-9-]/g, '-');
      
      // Make sure it starts with 'codform-' prefix for consistency
      if (!cleanedBlockId.startsWith('codform-')) {
        cleanedBlockId = `codform-${cleanedBlockId}`;
      }
      
      if (cleanedBlockId !== blockId) {
        console.log(`Cleaned block ID from "${blockId}" to "${cleanedBlockId}"`);
        setBlockId(cleanedBlockId);
      }
      
      // Verify connection one more time before saving
      try {
        const connectionValid = await verifyShopifyConnection();
        if (!connectionValid) {
          throw new Error(language === 'ar' 
            ? 'فشل التحقق من اتصال Shopify، يرجى إعادة الاتصال قبل المتابعة'
            : 'Shopify connection verification failed, please reconnect before continuing');
        }
      } catch (verifyError) {
        throw new Error(language === 'ar'
          ? 'حدث خطأ أثناء التحقق من اتصال Shopify، يرجى إعادة المحاولة'
          : 'Error verifying Shopify connection, please try again');
      }
      
      // Log form data for debugging
      const formData: ShopifyFormData = {
        form_id: formId,
        settings: {
          enabled: true,
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
    
    // Use the manualReconnect function from useShopify
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

  // Show a warning if Shopify is not connected based on connection state
  if (connectionState === 'error' || !shopifyConnected || !shop) {
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
                ? 'معرف فريد يستخدم لإدراج النموذج في الصفحة. يجب أن يبدأ بـ "codform-" ويحتوي على أحرف وأرقام فقط.' 
                : 'A unique identifier used to embed the form in the page. Should start with "codform-" and contain only letters and numbers.'}
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
