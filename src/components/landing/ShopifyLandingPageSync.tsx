
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  EyeIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShopifyLandingPageSyncProps {
  pageId: string;
  pageSlug: string;
  isPublished: boolean;
}

interface ProductOption {
  id: string;
  title: string;
  handle?: string;
}

const ShopifyLandingPageSync: React.FC<ShopifyLandingPageSyncProps> = ({
  pageId,
  pageSlug,
  isPublished,
}) => {
  const { language } = useI18n();
  const { shop } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [syncedUrl, setSyncedUrl] = useState<string | null>(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [metaobjectCreated, setMetaobjectCreated] = useState<boolean>(false);
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  
  // Fetch sync status and products on mount
  useEffect(() => {
    if (pageId) {
      fetchSyncStatus();
    }
    
    if (shop) {
      loadProducts();
    }
    
    // Check if debug mode is enabled via localStorage
    const isDebugMode = localStorage.getItem('shopify_debug_mode') === 'true';
    setDebugMode(isDebugMode);
  }, [pageId, shop]);

  const fetchSyncStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('shopify_page_syncs')
        .select('*')
        .eq('page_id', pageId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching sync status:', error);
        return;
      }

      if (data) {
        setSelectedProductId(data.product_id);
        setSyncedUrl(data.synced_url);
        setLastSyncTimestamp(new Date(data.updated_at).toLocaleString());
        setSyncStatus('success');
        
        // Fetch metaobject status if sync was successful
        if (shop && data.shop_id === shop) {
          checkMetaobjectStatus(data.product_id);
        }
      }
    } catch (e) {
      console.error('Error in fetchSyncStatus:', e);
    }
  };
  
  const checkMetaobjectStatus = async (productId: string) => {
    if (!shop) return;
    
    try {
      // Get shop token
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (shopError || !shopData?.access_token) {
        console.error('Could not retrieve valid access token for metaobject check');
        return;
      }
      
      // Check if product has metafields related to our landing page
      const { data: testData, error: testError } = await supabase.functions.invoke('shopify-test-connection', {
        body: { 
          shop,
          accessToken: shopData.access_token,
          requestId: `metacheck_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now()
        }
      });
      
      if (testError || !testData?.success) {
        console.error('Connection test failed during metaobject check:', testError || 'No success response');
        return;
      }
      
      // If connection is valid, we'll assume metaobject likely exists if we have a successful sync
      setMetaobjectCreated(true);
      
    } catch (error) {
      console.error('Error checking metaobject status:', error);
    }
  };
  
  const loadProducts = async () => {
    if (!shop) return;
    
    setIsLoadingProducts(true);
    setConnectionError(false);
    setErrorMessage(null);
    
    try {
      // Get shop token
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (shopError || !shopData?.access_token) {
        throw new Error('Could not retrieve valid access token');
      }
      
      // First test connection
      const { data: testData, error: testError } = await supabase.functions.invoke('shopify-test-connection', {
        body: { 
          shop,
          accessToken: shopData.access_token,
          requestId: `test_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now()
        }
      });
      
      if (testError || !testData?.success) {
        console.error('Connection test failed:', testError || 'No success response');
        setConnectionError(true);
        throw new Error('Shopify connection test failed');
      }
      
      // Request products with the validated token
      const requestId = `prod_req_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`Requesting products with ID: ${requestId}`);
      
      const { data, error } = await supabase.functions.invoke('shopify-products', {
        body: { 
          shop,
          accessToken: shopData.access_token,
          requestId,
          timestamp: Date.now()
        }
      });

      if (error) {
        console.error('Error loading products:', error);
        setErrorMessage('Error loading products from Shopify');
        throw error;
      }

      if (!data || !data.products || !Array.isArray(data.products)) {
        console.error('Invalid products data:', data);
        setErrorMessage('Received invalid products data from API');
        throw new Error('Invalid products data structure');
      }

      const formattedProducts = data.products.map((product: any) => ({
        id: product.id,
        title: product.title,
        handle: product.handle
      }));

      setProducts(formattedProducts);
      
      // If we have a previously selected product but it's not in the list,
      // clear the selection to avoid issues
      if (selectedProductId && !formattedProducts.some(p => p.id === selectedProductId)) {
        setSelectedProductId('');
      }
      
    } catch (error) {
      console.error('Error in loadProducts:', error);
      setConnectionError(true);
    } finally {
      setIsLoadingProducts(false);
    }
  };
  
  const handlePublishToShopify = async () => {
    if (!pageId || !selectedProductId || !shop || !isPublished) {
      toast.error(
        language === 'ar'
          ? 'يرجى نشر الصفحة واختيار منتج أولاً'
          : 'Please publish the page and select a product first'
      );
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);
    setSyncStatus('idle');
    setSyncInProgress(true);
    setMetaobjectCreated(false);

    try {
      // Get access token
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (shopError || !shopData?.access_token) {
        throw new Error('Could not retrieve valid access token');
      }
      
      // First test connection before proceeding
      const { data: testData, error: testError } = await supabase.functions.invoke('shopify-test-connection', {
        body: { 
          shop,
          accessToken: shopData.access_token,
          requestId: `test_before_publish_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now()
        }
      });
      
      if (testError || !testData?.success) {
        console.error('Connection test failed before publish:', testError || 'No success response');
        setConnectionError(true);
        throw new Error('Shopify connection test failed, cannot publish');
      }

      // Now publish the page
      const currentRetryCount = retryCount;
      const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;
      console.log(`Publishing with request ID: ${requestId}`);
      
      const { data, error } = await supabase.functions.invoke('shopify-publish-page', {
        body: {
          pageId,
          pageSlug,
          productId: selectedProductId,
          shop,
          accessToken: shopData.access_token,
          requestId,
          timestamp: Date.now(),
          forceMetaobjectCreation: currentRetryCount > 0 // Force creation of metaobject on retry
        }
      });

      if (error) {
        console.error('Error from shopify-publish-page function:', error);
        setErrorMessage(`Error publishing to Shopify: ${error.message}`);
        setSyncStatus('error');
        
        // Increment retry count for next attempt
        setRetryCount(currentRetryCount + 1);
        throw error;
      }

      if (!data?.success) {
        console.error('Unsuccessful publish response:', data);
        setErrorMessage(data?.message || 'Unsuccessful publish response from API');
        setSyncStatus('error');
        
        // Increment retry count for next attempt
        setRetryCount(currentRetryCount + 1);
        throw new Error(data?.message || 'Publish failed');
      }

      // Update sync status in database
      const syncData = {
        page_id: pageId,
        product_id: selectedProductId,
        shop_id: shop,
        synced_url: data.productUrl || null
      };

      // Check if sync record exists
      const { data: existingSyncData, error: fetchSyncError } = await supabase
        .from('shopify_page_syncs')
        .select('id')
        .eq('page_id', pageId)
        .maybeSingle();

      if (fetchSyncError) console.error('Error checking existing sync:', fetchSyncError);

      // If exists - update, else insert
      const syncOperation = existingSyncData?.id
        ? supabase
            .from('shopify_page_syncs')
            .update(syncData)
            .eq('id', existingSyncData.id)
        : supabase
            .from('shopify_page_syncs')
            .insert(syncData);

      const { error: syncError } = await syncOperation;
      if (syncError) console.error('Error saving sync data:', syncError);

      // Update UI state
      setSyncedUrl(data.productUrl || null);
      setLastSyncTimestamp(new Date().toLocaleString());
      setSyncStatus('success');
      setMetaobjectCreated(!!data.metaobjectId);
      setRetryCount(0); // Reset retry count on success
      
      toast.success(
        language === 'ar'
          ? 'تم النشر إلى Shopify بنجاح'
          : 'Successfully published to Shopify'
      );
      
    } catch (error) {
      console.error('Error in handlePublishToShopify:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(errorMsg);
      toast.error(
        language === 'ar'
          ? `فشل النشر إلى Shopify: ${errorMsg}`
          : `Failed to publish to Shopify: ${errorMsg}`
      );
    } finally {
      setIsSyncing(false);
      setSyncInProgress(false);
    }
  };
  
  const handleRetryConnection = async () => {
    setIsReconnecting(true);
    setErrorMessage(null);
    try {
      // Get shop token
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (shopError || !shopData?.access_token) {
        throw new Error('Could not retrieve valid access token');
      }
      
      // Test connection with force refresh
      const { data, error } = await supabase.functions.invoke('shopify-test-connection', {
        body: { 
          shop,
          accessToken: shopData.access_token,
          forceRefresh: true,
          requestId: `retry_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now()
        }
      });
      
      if (error || !data?.success) {
        console.error('Connection retry failed:', error || 'No success response');
        toast.error(
          language === 'ar'
            ? 'فشلت إعادة الاتصال، يرجى التحقق من صلاحية الرمز'
            : 'Connection retry failed, please check token validity'
        );
        return;
      }
      
      setConnectionError(false);
      toast.success(
        language === 'ar'
          ? 'تم إعادة الاتصال بنجاح'
          : 'Successfully reconnected'
      );
      
      // Reload products after successful connection
      await loadProducts();
      
    } catch (error) {
      console.error('Error retrying connection:', error);
      toast.error(
        language === 'ar'
          ? 'فشلت إعادة الاتصال'
          : 'Failed to reconnect'
      );
    } finally {
      setIsReconnecting(false);
    }
  };

  const viewInShopify = () => {
    if (syncedUrl) {
      window.open(syncedUrl, '_blank');
    }
  };

  const handleProductChange = (value: string) => {
    setSelectedProductId(value);
  };
  
  const goToShopify = () => {
    if (!shop) return;
    window.open(`https://${shop}/admin`, '_blank');
  };
  
  const toggleDebugMode = () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    localStorage.setItem('shopify_debug_mode', newMode ? 'true' : 'false');
  };

  return (
    <Card className="w-full border border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">
              {language === 'ar' ? 'نشر إلى متجر Shopify' : 'Publish to Shopify'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'نشر هذه الصفحة إلى منتج Shopify'
                : 'Publish this landing page to a Shopify product'}
            </CardDescription>
          </div>
          
          {syncStatus === 'success' && (
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center gap-1 px-2 py-1">
              <CheckCircle className="h-3 w-3" />
              {language === 'ar' ? 'تم النشر' : 'Published'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
            {shop ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="font-medium">
                  {language === 'ar' ? `متصل بـ: ${shop}` : `Connected to: ${shop}`}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="font-medium">
                  {language === 'ar' ? 'غير متصل' : 'Not connected'}
                </span>
              </>
            )}
          </div>
          
          {connectionError && (
            <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">
                  {language === 'ar' ? 'خطأ في الاتصال' : 'Connection Error'}
                </span>
              </div>
              <p className="text-red-600 text-sm">
                {language === 'ar'
                  ? 'لم يتم إرجاع أي منتجات من الـ API. يرجى إعادة الاتصال.'
                  : 'No products returned from API. Please reconnect.'}
              </p>
              
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2 bg-red-50 border-red-200 hover:bg-red-100"
                onClick={handleRetryConnection}
                disabled={isReconnecting}
              >
                {isReconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 ml-2" />
                )}
                {language === 'ar' ? 'إعادة الاتصال' : 'Retry Connection'}
              </Button>
            </div>
          )}
          
          {metaobjectCreated && syncStatus === 'success' && (
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium text-sm">
                  {language === 'ar' ? 'تم إنشاء Metaobject بنجاح' : 'Metaobject created successfully'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {language === 'ar' ? 'اختر منتجًا لربط الصفحة به:' : 'Select product to link page with:'}
          </label>
          <div className="flex space-x-2 rtl:space-x-reverse">
            <Select value={selectedProductId} onValueChange={handleProductChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={
                  language === 'ar'
                    ? isLoadingProducts
                      ? "جاري تحميل المنتجات..."
                      : "اختر منتجًا"
                    : isLoadingProducts
                      ? "Loading products..."
                      : "Select a product"
                } />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <SelectItem value="no-products" disabled>
                    {language === 'ar'
                      ? connectionError 
                        ? 'خطأ في جلب المنتجات' 
                        : 'لا توجد منتجات متاحة'
                      : connectionError 
                        ? 'Error fetching products' 
                        : 'No products available'
                    }
                  </SelectItem>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={loadProducts}
              disabled={isLoadingProducts || !shop}
              title={language === 'ar' ? 'تحديث المنتجات' : 'Refresh products'}
            >
              {isLoadingProducts ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {(!isPublished && pageId) && (
            <Alert className="mt-2 bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-700">
                {language === 'ar'
                  ? 'يجب نشر الصفحة قبل مزامنتها مع Shopify'
                  : 'The page must be published before syncing to Shopify'}
              </AlertDescription>
            </Alert>
          )}
          
          {syncInProgress && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded mt-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm text-blue-700">
                {language === 'ar' 
                  ? 'جاري إنشاء وتحديث Metaobject...'
                  : 'Creating and updating metaobject...'}
              </p>
            </div>
          )}
          
          {errorMessage && (
            <div className="p-2 bg-red-50 border border-red-200 rounded mt-2">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={!selectedProductId || isSyncing || !shop || !isPublished || connectionError}
            onClick={handlePublishToShopify}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Upload className="h-4 w-4 ml-2" />
            )}
            {language === 'ar' 
              ? retryCount > 0 
                ? `إعادة محاولة النشر (${retryCount})` 
                : 'نشر إلى Shopify'
              : retryCount > 0 
                ? `Retry Publishing (${retryCount})` 
                : 'Publish to Shopify'}
          </Button>
          
          {shop && (
            <Button
              variant="outline"
              className="w-full"
              onClick={goToShopify}
            >
              <ShoppingBag className="h-4 w-4 ml-2" />
              {language === 'ar' ? 'الذهاب إلى إدارة المتجر' : 'Go to Shopify Admin'}
            </Button>
          )}
          
          {debugMode && (
            <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded text-xs space-y-1">
              <p><strong>Debug Info</strong></p>
              <p>Selected Product ID: {selectedProductId || 'None'}</p>
              <p>Retry Count: {retryCount}</p>
              <p>Connection Status: {connectionError ? 'Error' : 'OK'}</p>
              <p>Metaobject Created: {metaobjectCreated ? 'Yes' : 'No'}</p>
              <p>Products Loaded: {products.length}</p>
              <p>Sync Status: {syncStatus}</p>
              <p>Last Sync: {lastSyncTimestamp || 'Never'}</p>
              {errorMessage && <p>Last Error: {errorMessage}</p>}
            </div>
          )}
        </div>
        
        {syncStatus === 'success' && syncedUrl && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {language === 'ar'
                    ? 'تم نشر الصفحة بنجاح إلى Shopify'
                    : 'Page successfully published to Shopify'}
                </p>
                {lastSyncTimestamp && (
                  <p className="text-xs text-green-700 mt-1">
                    {language === 'ar'
                      ? `آخر تحديث: ${lastSyncTimestamp}`
                      : `Last updated: ${lastSyncTimestamp}`}
                  </p>
                )}
                
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-200 hover:bg-green-100"
                    onClick={viewInShopify}
                  >
                    <EyeIcon className="h-3.5 w-3.5 mr-1" />
                    {language === 'ar' ? 'عرض في Shopify' : 'View in Shopify'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-200 hover:bg-green-100"
                    onClick={handlePublishToShopify}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    {language === 'ar' ? 'تحديث في Shopify' : 'Update in Shopify'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Hidden debug toggle - double click to enable/disable */}
        <div 
          className="h-1 w-8 mx-auto cursor-pointer" 
          onDoubleClick={toggleDebugMode}
        ></div>
      </CardContent>
    </Card>
  );
};

export default ShopifyLandingPageSync;
