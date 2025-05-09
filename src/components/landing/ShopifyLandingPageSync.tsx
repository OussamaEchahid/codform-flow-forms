
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';
import { Store, LoaderCircle, Eye, ExternalLink, RefreshCw, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ShopifyLandingPageSyncProps {
  pageId: string;
  pageSlug: string;
  isPublished: boolean;
}

const ShopifyLandingPageSync: React.FC<ShopifyLandingPageSyncProps> = ({ 
  pageId, 
  pageSlug,
  isPublished 
}) => {
  const { t, language } = useI18n();
  const { isConnected, shop, refreshConnection, testConnection } = useShopify();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'not_synced' | 'syncing' | 'synced'>('not_synced');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [syncedUrl, setSyncedUrl] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [productData, setProductData] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionVerified, setConnectionVerified] = useState(false);
  const [verifyingConnection, setVerifyingConnection] = useState(false);
  const [isCreatingMetaobject, setIsCreatingMetaobject] = useState(false);
  const [metaobjectStatus, setMetaobjectStatus] = useState<'not_created' | 'creating' | 'created'>('not_created');
  
  useEffect(() => {
    if (pageId) {
      checkSyncStatus();
      fetchPageProduct();
      
      // Automatically verify Shopify connection on component mount
      verifyShopifyConnection();
    }
  }, [pageId]);
  
  // Function to verify the Shopify connection
  const verifyShopifyConnection = async () => {
    if (!isConnected || !shop) {
      setConnectionVerified(false);
      return;
    }
    
    try {
      setVerifyingConnection(true);
      
      // Test the connection using the testConnection function from useShopify
      const isValid = await testConnection();
      
      console.log("Shopify connection test result:", isValid);
      setConnectionVerified(isValid);
      
      if (!isValid) {
        setErrorDetails('توكن الاتصال بشوبيفاي غير صالح. يرجى إعادة الاتصال بمتجرك.');
      }
    } catch (error) {
      console.error("Error verifying Shopify connection:", error);
      setConnectionVerified(false);
      setErrorDetails('حدث خطأ أثناء التحقق من اتصال شوبيفاي. يرجى المحاولة مرة أخرى.');
    } finally {
      setVerifyingConnection(false);
    }
  };
  
  const checkSyncStatus = async () => {
    try {
      // Check if this page has been synced with Shopify
      const { data, error } = await supabase
        .from('shopify_page_syncs')
        .select('id, synced_url')
        .eq('page_id', pageId)
        .limit(1);
        
      if (!error && data && data.length > 0) {
        setSyncStatus('synced');
        setSyncedUrl(data[0].synced_url || null);
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };
  
  const fetchPageProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('product_id')
        .eq('id', pageId)
        .maybeSingle();
        
      if (!error && data && data.product_id) {
        setProductId(data.product_id);
        console.log('Found product ID for page:', data.product_id);
        
        // If it's a Shopify product ID, try to fetch more details
        if (data.product_id.startsWith('gid://shopify/Product/') && shop) {
          fetchProductDetails(data.product_id);
        }
      }
    } catch (error) {
      console.error('Error fetching page product ID:', error);
    }
  };
  
  // Fetch product details from Shopify
  const fetchProductDetails = async (productGid: string) => {
    if (!shop) return;
    
    try {
      // Extract the ID from the GID
      const productId = productGid.split('/').pop();
      
      // Call our API to get product details with improved error handling
      const productsResponse = await supabase.functions.invoke('shopify-products', {
        body: { 
          shop,
          accessToken: 'token_fetch_only', // Token will be fetched server-side for security
          requestId: `req_${Date.now()}`, // Add unique request ID for debugging
          timestamp: new Date().toISOString()
        }
      });
      
      if (productsResponse.error) {
        console.error('Error from shopify-products function:', productsResponse.error);
        throw new Error(`فشل في جلب تفاصيل المنتج: ${productsResponse.error.message || 'خطأ غير معروف'}`);
      }
      
      const data = productsResponse.data;
      
      if (data?.products && Array.isArray(data.products)) {
        // Find the product that matches our ID
        const product = data.products.find(
          (p: any) => p.id === productGid || p.id.endsWith(`/${productId}`)
        );
        
        if (product) {
          setProductData(product);
          console.log('Found product details:', product);
        } else {
          console.log('Product not found in fetched products. Available products:', 
            data.products.map((p: any) => ({id: p.id, title: p.title})));
          throw new Error(`لم يتم العثور على المنتج بمعرف: ${productId}`);
        }
      } else {
        console.log('No products returned from API');
        throw new Error('لم يتم إرجاع أي منتجات من الـ API');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setErrorDetails(error instanceof Error ? error.message : 'خطأ في جلب تفاصيل المنتج');
      return null;
    }
  };
  
  const handleRetry = async () => {
    setIsRetrying(true);
    setErrorDetails(null);
    
    try {
      // Try to refresh the connection first
      const refreshed = await refreshConnection();
      
      if (refreshed) {
        toast.success(language === 'ar' 
          ? 'تم تجديد الاتصال بشوبيفاي بنجاح' 
          : 'Successfully reconnected to Shopify');
        
        // Verify the connection
        await verifyShopifyConnection();
        
        // Re-fetch product details if we have a product ID
        if (productId) {
          await fetchProductDetails(productId);
        }
      } else {
        throw new Error('لم يتم تجديد الاتصال');
      }
    } catch (error) {
      console.error('Error retrying connection:', error);
      toast.error(language === 'ar' 
        ? 'فشل في تجديد الاتصال، يرجى إعادة الاتصال يدويًا' 
        : 'Failed to refresh connection, please reconnect manually');
    } finally {
      setIsRetrying(false);
    }
  };
  
  const handleSync = async () => {
    if (!isConnected) {
      toast.error(language === 'ar' 
        ? 'يجب الاتصال بشوبيفاي أولاً' 
        : 'You must connect to Shopify first');
      return;
    }
    
    if (!isPublished) {
      toast.error(language === 'ar' 
        ? 'يجب نشر الصفحة أولاً قبل مزامنتها مع شوبيفاي' 
        : 'You must publish the page first before syncing with Shopify');
      return;
    }
    
    if (!connectionVerified && !verifyingConnection) {
      // Verify the connection first if not already verified
      await verifyShopifyConnection();
      if (!connectionVerified) {
        toast.error(language === 'ar' 
          ? 'يجب التحقق من صلاحية الاتصال بشوبيفاي أولاً' 
          : 'Shopify connection must be verified first');
        return;
      }
    }
    
    setIsSyncing(true);
    setSyncStatus('syncing');
    setErrorDetails(null);
    setMetaobjectStatus('creating');
    
    try {
      // Send request with debugging information
      const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;
      const requestTimestamp = new Date().toISOString();
      
      console.log(`Starting publish request ${requestId} at ${requestTimestamp}`);
      
      // First create the metaobject using the specialized function
      setIsCreatingMetaobject(true);
      
      // Call the API to publish the landing page to Shopify
      const publishResponse = await supabase.functions.invoke('shopify-publish-page', {
        body: { 
          pageId,
          pageSlug,
          shop,
          productId, // Send the product ID to link with the product page
          requestId, // Send request ID for tracking
          timestamp: requestTimestamp,
          forceRecreateMetaobject: true // Force recreation of metaobject
        }
      });
      
      if (publishResponse.error) {
        console.error('Error from shopify-publish-page function:', publishResponse.error);
        throw new Error(publishResponse.error.message || 'خطأ غير معروف في نشر الصفحة');
      }
      
      setIsCreatingMetaobject(false);
      setMetaobjectStatus('created');
      
      const data = publishResponse.data;
      
      if (data?.success) {
        toast.success(language === 'ar' 
          ? 'تم نشر الصفحة على شوبيفاي بنجاح' 
          : 'Page published to Shopify successfully');
        setSyncStatus('synced');
        
        // Save the URL of the published page
        if (data?.url) {
          setSyncedUrl(data.url);
        }
        
        // If we synced a product, refresh its data
        if (productId) {
          fetchProductDetails(productId);
        }
      } else {
        throw new Error(data?.message || 'خطأ غير معروف');
      }
    } catch (error) {
      console.error('Error publishing to Shopify:', error);
      setSyncStatus('not_synced');
      setMetaobjectStatus('not_created');
      
      // Extract error message to show to user
      let errorMsg = 'Error connecting to Shopify';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error && 'message' in error) {
        errorMsg = String(error.message);
      }
      
      setErrorDetails(errorMsg);
      
      toast.error(language === 'ar' 
        ? 'خطأ في نشر الصفحة على شوبيفاي' 
        : 'Error publishing to Shopify');
    } finally {
      setIsSyncing(false);
      setIsCreatingMetaobject(false);
    }
  };

  const viewShopifyPage = () => {
    if (!shop) return;
    
    if (syncedUrl) {
      window.open(syncedUrl, '_blank');
      return;
    }
    
    // Open the Shopify page in a new tab
    const domain = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
    window.open(`https://${domain}/pages/${pageSlug}`, '_blank');
  };

  const viewProductPage = () => {
    if (!shop || !productId) return;
    
    // If we have syncedUrl from a product sync, use that directly
    if (syncedUrl && productId) {
      window.open(syncedUrl, '_blank');
      return;
    }
    
    // If we have product data with a handle, use that
    if (productData && productData.handle) {
      const domain = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
      window.open(`https://${domain}/products/${productData.handle}`, '_blank');
      return;
    }
    
    // Otherwise try to extract product ID from GID
    let shopifyProductId = productId;
    if (productId.startsWith('gid://shopify/Product/')) {
      const parts = productId.split('/');
      shopifyProductId = parts[parts.length - 1];
    }
    
    // Open the product page in Shopify admin
    const domain = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
    window.open(`https://${domain}/admin/products/${shopifyProductId}`, '_blank');
  };

  const viewLocalPage = () => {
    window.open(`/landing/${pageSlug}`, '_blank');
  };
  
  const handleFixConnection = () => {
    window.location.href = '/shopify-connect';
  };
  
  const openMetaobjectsAdmin = () => {
    if (!shop) return;
    
    // Open the Shopify metaobjects admin page
    const domain = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
    window.open(`https://admin.shopify.com/store/${shop.replace('.myshopify.com', '')}/content/metaobjects`, '_blank');
  };
  
  if (!isConnected) {
    return (
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <p className="text-amber-800">
          {language === 'ar'
            ? 'يجب الاتصال بشوبيفاي أولاً لنشر الصفحة على متجرك'
            : 'You need to connect to Shopify first to publish the page to your store'}
        </p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.href = '/shopify-connect'}
        >
          {language === 'ar' ? 'اتصل بشوبيفاي' : 'Connect to Shopify'}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">
          {language === 'ar' ? 'نشر على شوبيفاي' : 'Publish to Shopify'}
        </h3>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4" />
              <span className="sr-only">More information</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">
                {language === 'ar' ? 'كيف يعمل هذا؟' : 'How does this work?'}
              </h4>
              <p className="text-sm text-gray-600">
                {language === 'ar'
                  ? 'عند النقر على "نشر على شوبيفاي"، نقوم بإنشاء metaobject مخصص في متجر شوبيفاي الخاص بك لتخزين محتوى صفحة الهبوط. إذا ربطت الصفحة بمنتج، سيتم تحديث وصف المنتج أيضًا بنفس المحتوى.'
                  : 'When you click "Publish to Shopify", we create a custom metaobject in your Shopify store to store your landing page content. If you\'ve linked the page to a product, the product description will also be updated with the same content.'}
              </p>
              
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs" 
                  onClick={openMetaobjectsAdmin}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {language === 'ar' 
                    ? 'عرض Metaobjects في شوبيفاي' 
                    : 'View Metaobjects in Shopify'}
                </Button>
              </div>
              
              <div className="mt-4 text-sm">
                <h5 className="text-orange-700 font-medium">
                  {language === 'ar' 
                    ? '🛠️ حلول شائعة للأخطاء:'
                    : '🛠️ Common error solutions:'}
                </h5>
                <ul className="list-disc list-inside mt-1 text-orange-600 space-y-1">
                  <li>
                    {language === 'ar'
                      ? 'تأكد من أن رمز الوصول ساري المفعول في متجرك'
                      : 'Make sure your access token is valid for your store'}
                  </li>
                  <li>
                    {language === 'ar'
                      ? 'حاول إعادة الاتصال بمتجرك عبر زر "إعادة المحاولة"'
                      : 'Try reconnecting to your store using the "Retry Connection" button'}
                  </li>
                  <li>
                    {language === 'ar'
                      ? 'إذا استمرت المشكلة، قم بالعودة للصفحة الرئيسية وإعادة الاتصال'
                      : 'If problems persist, return to the home page and reconnect'}
                  </li>
                </ul>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        {language === 'ar'
          ? 'انشر صفحة الهبوط هذه في متجر شوبيفاي الخاص بك وقم بتطبيقها على صفحة المنتج'
          : 'Publish this landing page to your Shopify store and apply it to the product page'}
      </p>
      
      {/* Connection Status */}
      <Alert className="mb-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <div className={`h-3 w-3 mt-1 rounded-full ${connectionVerified ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
          <div>
            <AlertTitle className="font-medium">
              {language === 'ar' ? 'حالة الاتصال' : 'Connection Status'}
            </AlertTitle>
            <AlertDescription>
              {verifyingConnection ? (
                language === 'ar' ? 'جارٍ التحقق من اتصال شوبيفاي...' : 'Verifying Shopify connection...'
              ) : connectionVerified ? (
                language === 'ar' ? `✓ متصل بمتجر: ${shop}` : `✓ Connected to store: ${shop}`
              ) : (
                language === 'ar' ? '⚠️ لم يتم التحقق من الاتصال' : '⚠️ Connection not verified'
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
      
      {/* Product information */}
      {productId ? (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertTitle className="text-green-800 font-medium">
            {language === 'ar'
              ? 'سيتم تطبيق هذه الصفحة على المنتج'
              : 'This page will be applied to product'}
          </AlertTitle>
          <AlertDescription className="text-green-800">
            {productData ? (
              <>
                {language === 'ar'
                  ? `المنتج: ${productData.title}`
                  : `Product: ${productData.title}`}
              </>
            ) : (
              <>
                {language === 'ar'
                  ? 'سيتم تحديث وصف المنتج بالكامل بمحتوى صفحة الهبوط هذه.'
                  : 'The product description will be completely replaced with this landing page content.'}
              </>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertDescription className="text-amber-800">
            {language === 'ar'
              ? 'لم يتم تحديد منتج لهذه الصفحة. يرجى تحديد منتج أولاً في إعدادات الصفحة.'
              : 'No product has been selected for this page. Please select a product first in the page settings.'}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Metaobject Status */}
      <Alert className={`mb-4 ${metaobjectStatus === 'created' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
        <AlertTitle className="font-medium">
          {language === 'ar' ? 'حالة Metaobject' : 'Metaobject Status'}
        </AlertTitle>
        <AlertDescription>
          {isCreatingMetaobject ? (
            <div className="flex items-center">
              <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
              {language === 'ar' ? 'جاري إنشاء Metaobject...' : 'Creating Metaobject...'}
            </div>
          ) : metaobjectStatus === 'created' ? (
            <div>
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                {language === 'ar' ? 'تم إنشاء Metaobject بنجاح' : 'Metaobject created successfully'}
              </div>
              <p className="text-xs mt-1">
                {language === 'ar'
                  ? 'يمكنك عرض الـ Metaobjects في لوحة تحكم شوبيفاي'
                  : 'You can view metaobjects in your Shopify admin'}
              </p>
              <Button 
                variant="link" 
                size="sm" 
                className="text-xs p-0 h-auto mt-1" 
                onClick={openMetaobjectsAdmin}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {language === 'ar' ? 'عرض في شوبيفاي' : 'View in Shopify'}
              </Button>
            </div>
          ) : (
            <div>
              {language === 'ar'
                ? 'سيتم إنشاء Metaobject لتخزين محتوى الصفحة عند النشر على شوبيفاي'
                : 'A metaobject will be created to store the page content when publishing to Shopify'}
            </div>
          )}
        </AlertDescription>
      </Alert>
      
      {/* Connection error message */}
      {errorDetails && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <AlertTitle className="text-red-700">
                {language === 'ar' ? 'خطأ في الاتصال' : 'Connection Error'}
              </AlertTitle>
              <AlertDescription className="text-red-600 text-sm">
                {errorDetails}
              </AlertDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 hover:bg-red-100 text-red-700"
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <>
                      <LoaderCircle className="h-3 w-3 mr-2 animate-spin" />
                      {language === 'ar' ? 'جاري إعادة الاتصال...' : 'Reconnecting...'}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2" />
                      {language === 'ar' ? 'إعادة المحاولة' : 'Retry Connection'}
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 hover:bg-red-100 text-red-700"
                  onClick={handleFixConnection}
                >
                  {language === 'ar' ? 'إعادة الاتصال بشوبيفاي' : 'Reconnect to Shopify'}
                </Button>
              </div>
            </div>
          </div>
        </Alert>
      )}
      
      {/* Preview buttons */}
      <div className="mb-4 border-b pb-4">
        <h4 className="text-sm font-medium mb-2">
          {language === 'ar' ? 'معاينة الصفحة' : 'Preview Page'}
        </h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={viewLocalPage}
            className="flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'معاينة محلية' : 'Local Preview'}
          </Button>
          
          {syncStatus === 'synced' && (
            <>
              {syncedUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={viewShopifyPage}
                  className="flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'معاينة الصفحة في شوبيفاي' : 'View Page in Shopify'}
                </Button>
              )}
              
              {productId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={viewProductPage}
                  className="flex items-center"
                >
                  <Store className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'صفحة المنتج في شوبيفاي' : 'View Product Page in Shopify'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Sync status and publishing */}
      {syncStatus === 'synced' ? (
        <div className="space-y-2">
          <div className="flex items-center text-green-600 text-sm">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {language === 'ar'
              ? 'تم النشر على شوبيفاي'
              : 'Published to Shopify'}
          </div>
          
          <Button
            variant="default"
            onClick={handleSync}
            disabled={isSyncing || !isPublished || verifyingConnection}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تحديث في شوبيفاي' : 'Update on Shopify'}
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {!isPublished && (
            <Alert variant="warning" className="mb-2">
              <AlertDescription>
                {language === 'ar'
                  ? 'يجب نشر الصفحة محليًا أولًا قبل المزامنة مع شوبيفاي'
                  : 'You must publish the page locally first before syncing with Shopify'}
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handleSync}
            disabled={isSyncing || !isPublished || verifyingConnection}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جاري النشر...' : 'Publishing...'}
              </>
            ) : verifyingConnection ? (
              <>
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جارٍ التحقق...' : 'Verifying...'}
              </>
            ) : (
              <>
                <Store className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'نشر على شوبيفاي' : 'Publish to Shopify'}
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 mt-1">
            {language === 'ar'
              ? 'سيتم إنشاء metaobjects مخصصة لتخزين بيانات الصفحة'
              : 'Custom metaobjects will be created to store page data'}
          </p>
        </div>
      )}

      {/* Help Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'مساعدة بخصوص مزامنة شوبيفاي' : 'Shopify Sync Help'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              {language === 'ar'
                ? 'إذا كنت تواجه مشاكل في المزامنة، تأكد من:'
                : 'If you\'re having issues with syncing, make sure:'}
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                {language === 'ar'
                  ? 'أنك متصل بمتجر شوبيفاي الصحيح'
                  : 'You\'re connected to the correct Shopify store'}
              </li>
              <li>
                {language === 'ar'
                  ? 'أن رمز الوصول الخاص بك ساري المفعول (قد تحتاج إلى إعادة الاتصال)'
                  : 'Your access token is valid (you may need to reconnect)'}
              </li>
              <li>
                {language === 'ar'
                  ? 'أن صفحة الهبوط تم نشرها محلياً'
                  : 'The landing page is published locally'}
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopifyLandingPageSync;
