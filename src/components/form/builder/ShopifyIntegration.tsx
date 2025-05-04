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
import { Loader, AlertCircle, Info, Check, RefreshCcw, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { useShopify } from '@/hooks/useShopify';

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
  const { shopifyConnected, shop } = useAuth();
  const [position, setPosition] = useState<'product-page' | 'cart-page' | 'checkout'>('product-page');
  const { 
    products, 
    isLoading: loadingProducts, 
    error,
    tokenError,
    tokenExpired,
    refreshConnection,
  } = useShopify();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [blockId, setBlockId] = useState<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error' | 'expired'>('idle');
  const [autoRefreshAttempted, setAutoRefreshAttempted] = useState(false);
  
  // تكوين معرف كتلة عشوائي إذا لم يكن موجودًا بالفعل
  React.useEffect(() => {
    if (!blockId) {
      const randomId = Math.random().toString(36).substring(2, 10);
      setBlockId(`codform-${randomId}`);
    }
  }, [blockId]);

  // التحقق من حالة الاتصال بالمتجر
  useEffect(() => {
    if (shopifyConnected && shop) {
      if (tokenExpired) {
        setConnectionStatus('expired');
        setSaveError(language === 'ar' 
          ? 'رمز الوصول للمتجر منتهي الصلاحية، يرجى إعادة الاتصال بالمتجر'
          : 'Your store access token has expired. Please reconnect to Shopify.');
      } else if (tokenError) {
        setConnectionStatus('error');
        setSaveError(language === 'ar' 
          ? 'رمز الوصول للمتجر غير صالح، يرجى إعادة الاتصال بالمتجر'
          : 'Your store access token is invalid. Please reconnect to Shopify.');
      } else {
        setConnectionStatus('success');
      }
    } else {
      setConnectionStatus('idle');
    }
    
    if (error) {
      setSaveError(error);
      
      // If the error is related to token issues, update connection status
      if (error.includes('token') || error.includes('access') || 
          error.includes('auth') || error.includes('Authentication') || 
          error.includes('صلاحية')) {
        setConnectionStatus('error');
      }
    }
  }, [shopifyConnected, shop, tokenError, tokenExpired, error, language]);

  // Auto refresh attempt for token expired case
  useEffect(() => {
    if (tokenExpired && !autoRefreshAttempted && shopifyConnected && shop) {
      setAutoRefreshAttempted(true);
      toast.info(language === 'ar' 
        ? 'رمز الوصول للمتجر منتهي الصلاحية. سنحاول تحديث الاتصال...'
        : 'Your store access token has expired. Trying to refresh connection...');
        
      // Auto-try the refresh connection after a short delay
      setTimeout(() => {
        refreshConnection().catch(console.error);
      }, 1500);
    }
  }, [tokenExpired, autoRefreshAttempted, refreshConnection, shopifyConnected, shop, language]);
  
  const handleSave = async () => {
    if (!shopifyConnected || !shop) {
      toast.error(language === 'ar' 
        ? 'يجب عليك الاتصال بـ Shopify أولاً'
        : 'You need to connect to Shopify first');
      return;
    }
    
    // Don't allow saving if token is expired/invalid
    if (tokenError || tokenExpired) {
      toast.error(language === 'ar' 
        ? 'يرجى تحديث اتصال المتجر أولاً قبل المحاولة مرة أخرى'
        : 'Please refresh your store connection first before trying again');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError(null);
      setConnectionStatus('checking');
      
      // تسجيل بيانات النموذج للتصحيح
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
      
      // استدعاء وظيفة الحفظ المقدمة من المكون الأب
      await onSave(formData);
      setConnectionStatus('success');
      
      toast.success(language === 'ar' 
        ? 'تم حفظ إعدادات شوبيفاي بنجاح'
        : 'Shopify settings saved successfully');
    } catch (error) {
      console.error('Error saving Shopify settings:', error);
      setConnectionStatus('error');
      const errorMessage = error instanceof Error 
        ? error.message 
        : language === 'ar' 
          ? 'حدث خطأ أثناء حفظ إعدادات شوبيفاي'
          : 'An error occurred while saving Shopify settings';
      
      setSaveError(errorMessage);
      toast.error(errorMessage);
      
      // Check if the error is related to token and trigger a connection retry if needed
      if (typeof errorMessage === 'string' && 
         (errorMessage.includes('token') || errorMessage.includes('access') || 
          errorMessage.includes('auth') || errorMessage.includes('Authentication') || 
          errorMessage.includes('صلاحية'))) {
        setConnectionStatus('expired');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshConnection = async () => {
    if (!shop) {
      toast.error(language === 'ar' 
        ? 'لا يوجد متجر متصل حاليًا'
        : 'No store is currently connected');
      return;
    }
    
    try {
      toast.info(language === 'ar' 
        ? 'سيتم إعادة توجيهك لتحديث الاتصال بـ Shopify'
        : 'You will be redirected to refresh your Shopify connection');
      
      await refreshConnection();
    } catch (error) {
      console.error('Error refreshing connection:', error);
      toast.error(language === 'ar' 
        ? 'حدث خطأ أثناء محاولة تحديث الاتصال'
        : 'An error occurred while trying to refresh the connection');
    }
  };

  // مكون خاص بإعادة محاولة الاتصال
  const RetryConnectionButton = () => (
    <Button 
      size="sm" 
      variant="default" 
      onClick={handleRefreshConnection} 
      className="flex items-center mt-4 bg-blue-500 hover:bg-blue-600"
    >
      <RefreshCcw className="h-4 w-4 mr-2" />
      {language === 'ar' ? 'تحديث اتصال المتجر' : 'Refresh Store Connection'}
    </Button>
  );

  // معالج مخصص للضغط على إعادة المحاولة مع العودة
  const handleRetryWithFallback = async () => {
    try {
      // Attempt to refresh connection instead of fetching products
      setConnectionStatus('checking');
      // Using refreshConnection instead of fetchProducts
      await refreshConnection();
      
      // If no error is thrown, connection is still valid
      toast.success(language === 'ar'
        ? 'تم تحديث الاتصال بنجاح'
        : 'Connection refreshed successfully');
      
      setConnectionStatus('success');
    } catch (error) {
      console.error('Error refreshing connection status:', error);
      
      // If that fails, try full reconnection
      handleRefreshConnection();
    }
  };

  const renderConnectionStatus = () => {
    if (connectionStatus === 'checking') {
      return (
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <Loader className="h-4 w-4 animate-spin text-blue-500 mr-2" />
          <AlertTitle>
            {language === 'ar' ? 'جاري التحقق من الاتصال...' : 'Verifying connection...'}
          </AlertTitle>
        </Alert>
      );
    } else if (connectionStatus === 'success') {
      return (
        <Alert className="bg-green-50 border-green-200 mb-4">
          <Check className="h-4 w-4 text-green-500 mr-2" />
          <AlertTitle>
            {language === 'ar' 
              ? `متصل بمتجر: ${shop}` 
              : `Connected to store: ${shop}`}
          </AlertTitle>
        </Alert>
      );
    } else if (connectionStatus === 'expired') {
      return (
        <Alert className="bg-orange-50 border-orange-200 mb-4">
          <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
          <AlertTitle className="font-bold text-orange-700">
            {language === 'ar' ? 'انتهت صلاحية الاتصال بالمتجر' : 'Store connection expired'}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {language === 'ar' 
              ? 'انتهت صلاحية رمز الوصول للمتجر. يجب تحديث الاتصال للمتابعة.' 
              : 'Your store access token has expired. You need to refresh the connection to continue.'}
          </AlertDescription>
          
          <RetryConnectionButton />
        </Alert>
      );
    } else if (connectionStatus === 'error') {
      return (
        <Alert className="bg-red-50 border-red-200 mb-4">
          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
          <AlertTitle className="font-bold text-red-700">
            {language === 'ar' ? 'فشل الاتصال بالمتجر' : 'Connection failed'}
          </AlertTitle>
          {saveError && <AlertDescription className="mt-2">{saveError}</AlertDescription>}
          
          <div className="mt-3 flex flex-col space-y-3">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRetryWithFallback}
              className="flex items-center w-full sm:w-auto"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
            </Button>
            
            <Button
              size="sm"
              variant="default"
              onClick={handleRefreshConnection}
              className="flex items-center w-full sm:w-auto bg-blue-500 hover:bg-blue-600"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إعادة الاتصال بالمتجر' : 'Reconnect to Shopify'}
            </Button>
            
            {shop && (
              <Button 
                size="sm" 
                variant="link" 
                className="flex items-center" 
                onClick={() => window.open(`https://${shop}/admin`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {language === 'ar' ? 'فتح لوحة تحكم Shopify' : 'Open Shopify Admin'}
              </Button>
            )}
          </div>
        </Alert>
      );
    }
    return null;
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
        {shopifyConnected ? (
          <>
            {renderConnectionStatus()}
            
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

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                variant="outline"
                onClick={handleRefreshConnection}
                className="flex-1"
                disabled={isSaving || isSyncing}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'تحديث الاتصال' : 'Refresh Connection'}
              </Button>

              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={isSaving || isSyncing || tokenError || tokenExpired || connectionStatus === 'error' || connectionStatus === 'expired'}
              >
                {(isSaving || isSyncing) ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  language === 'ar' ? 'حفظ التكامل' : 'Save Integration'
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
              <AlertTitle>
                {language === 'ar' 
                  ? 'أنت غير متصل بـ Shopify. قم بتسجيل الدخول لاستخدام هذه الميزة.'
                  : 'You are not connected to Shopify. Sign in to use this feature.'}
              </AlertTitle>
            </Alert>
            
            <Button 
              variant="secondary"
              className="w-full"
              onClick={() => window.location.href = '/shopify'}
            >
              {language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify'}
            </Button>
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
