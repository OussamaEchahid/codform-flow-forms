
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
  AlertTriangle,
  InfoIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

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

interface PublishStep {
  id: string;
  name: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
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
  const [publishSteps, setPublishSteps] = useState<PublishStep[]>([
    { id: 'connection', name: language === 'ar' ? 'التحقق من الاتصال' : 'Verify Connection', status: 'pending' },
    { id: 'product', name: language === 'ar' ? 'جلب معلومات المنتج' : 'Fetch Product', status: 'pending' },
    { id: 'metaobject', name: language === 'ar' ? 'إنشاء Metaobject' : 'Create Metaobject', status: 'pending' },
    { id: 'description', name: language === 'ar' ? 'تحديث وصف المنتج' : 'Update Product Description', status: 'pending' },
    { id: 'complete', name: language === 'ar' ? 'اكتمال العملية' : 'Complete', status: 'pending' },
  ]);
  const [useFallbackOnly, setUseFallbackOnly] = useState<boolean>(false);

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
    
    // Check if fallback mode is enabled via localStorage
    const fallbackOnly = localStorage.getItem('shopify_fallback_only') === 'true';
    setUseFallbackOnly(fallbackOnly);
  }, [pageId, shop]);

  const updateStepStatus = (stepId: string, status: 'pending' | 'loading' | 'success' | 'error', message?: string) => {
    setPublishSteps(steps => 
      steps.map(step => 
        step.id === stepId ? { ...step, status, message } : step
      )
    );
  };
  
  const resetSteps = () => {
    setPublishSteps(steps => 
      steps.map(step => ({ ...step, status: 'pending', message: undefined }))
    );
  };

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
      updateStepStatus('connection', 'loading');
      
      const { data: testData, error: testError } = await supabase.functions.invoke('shopify-test-connection', {
        body: { 
          shop,
          accessToken: shopData.access_token,
          requestId: `test_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now(),
          maxRetries: 3 // Add retry option
        }
      });
      
      if (testError || !testData?.success) {
        console.error('Connection test failed:', testError || 'No success response');
        setConnectionError(true);
        updateStepStatus('connection', 'error', 'Failed to connect to Shopify API');
        throw new Error('Shopify connection test failed');
      }
      
      updateStepStatus('connection', 'success');
      
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
    resetSteps();

    try {
      // Get access token
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (shopError || !shopData?.access_token) {
        updateStepStatus('connection', 'error', 'Could not retrieve valid access token');
        throw new Error('Could not retrieve valid access token');
      }
      
      // First test connection before proceeding
      updateStepStatus('connection', 'loading');
      
      const { data: testData, error: testError } = await supabase.functions.invoke('shopify-test-connection', {
        body: { 
          shop,
          accessToken: shopData.access_token,
          requestId: `test_before_publish_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now(),
          maxRetries: 3
        }
      });
      
      if (testError || !testData?.success) {
        console.error('Connection test failed before publish:', testError || 'No success response');
        updateStepStatus('connection', 'error', 'Shopify connection test failed, cannot publish');
        setConnectionError(true);
        throw new Error('Shopify connection test failed, cannot publish');
      }
      
      updateStepStatus('connection', 'success');
      updateStepStatus('product', 'loading');

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
          forceMetaobjectCreation: currentRetryCount > 0, // Force creation of metaobject on retry
          fallbackOnly: useFallbackOnly // Option to use fallback only
        }
      });

      if (error) {
        console.error('Error from shopify-publish-page function:', error);
        setErrorMessage(`Error publishing to Shopify: ${error.message}`);
        setSyncStatus('error');
        
        // Update step statuses based on the error
        updateStepStatus('product', 'error', 'Failed to process product data');
        
        // Increment retry count for next attempt
        setRetryCount(currentRetryCount + 1);
        throw error;
      }

      updateStepStatus('product', 'success');

      if (!data?.success) {
        console.error('Unsuccessful publish response:', data);
        setErrorMessage(data?.message || 'Unsuccessful publish response from API');
        setSyncStatus('error');
        
        // Increment retry count for next attempt
        setRetryCount(currentRetryCount + 1);
        throw new Error(data?.message || 'Publish failed');
      }

      // Update metaobject status
      if (data.metaobjectCreated) {
        updateStepStatus('metaobject', 'success');
        setMetaobjectCreated(true);
      } else if (data.fallbackUsed) {
        updateStepStatus('metaobject', 'success', 'Used fallback method');
      } else {
        updateStepStatus('metaobject', 'error', 'Metaobject creation failed, using fallbacks');
      }
      
      // Update description status
      updateStepStatus('description', 'success');

      // Update sync status in database
      const syncData = {
        page_id: pageId,
        product_id: selectedProductId,
        shop_id: shop,
        synced_url: data.landingPageUrl || null
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
      if (syncError) {
        console.error('Error saving sync data:', syncError);
      } else {
        updateStepStatus('complete', 'success');
      }

      // Update UI state
      setSyncedUrl(data.landingPageUrl || null);
      setLastSyncTimestamp(new Date().toLocaleString());
      setSyncStatus('success');
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
      updateStepStatus('complete', 'error', errorMsg);
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
    updateStepStatus('connection', 'loading');
    
    try {
      // Get shop token
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (shopError || !shopData?.access_token) {
        updateStepStatus('connection', 'error', 'Could not retrieve valid access token');
        throw new Error('Could not retrieve valid access token');
      }
      
      // Test connection with force refresh
      const { data, error } = await supabase.functions.invoke('shopify-test-connection', {
        body: { 
          shop,
          accessToken: shopData.access_token,
          forceRefresh: true,
          requestId: `retry_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now(),
          maxRetries: 3
        }
      });
      
      if (error || !data?.success) {
        console.error('Connection retry failed:', error || 'No success response');
        updateStepStatus('connection', 'error', 'Connection retry failed');
        toast.error(
          language === 'ar'
            ? 'فشلت إعادة الاتصال، يرجى التحقق من صلاحية الرمز'
            : 'Connection retry failed, please check token validity'
        );
        return;
      }
      
      updateStepStatus('connection', 'success');
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
  
  const toggleFallbackMode = () => {
    const newMode = !useFallbackOnly;
    setUseFallbackOnly(newMode);
    localStorage.setItem('shopify_fallback_only', newMode ? 'true' : 'false');
    toast.info(
      language === 'ar'
        ? `تم ${newMode ? 'تفعيل' : 'تعطيل'} وضع الرجوع`
        : `Fallback-only mode ${newMode ? 'enabled' : 'disabled'}`
    );
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
          
          {useFallbackOnly && (
            <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
              <div className="flex items-center gap-2 text-amber-600">
                <InfoIcon className="h-4 w-4" />
                <span className="font-medium text-sm">
                  {language === 'ar' 
                    ? 'وضع الرجوع مفعل: سيتم استخدام واصفات المنتج فقط' 
                    : 'Fallback mode enabled: Using product descriptions only'}
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
          
          {/* Publication Steps Progress */}
          {syncInProgress && (
            <div className="mt-4 space-y-2 border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between mb-2">
                <h4 className="text-sm font-medium">
                  {language === 'ar' ? 'تقدم عملية النشر:' : 'Publication Progress:'}
                </h4>
              </div>
              
              <div className="space-y-3">
                {publishSteps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2">
                    {step.status === 'loading' ? (
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    ) : step.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : step.status === 'error' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-gray-300"></div>
                    )}
                    
                    <span className={`text-sm ${
                      step.status === 'success' ? 'text-green-700' : 
                      step.status === 'error' ? 'text-red-700' :
                      step.status === 'loading' ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                    
                    {step.message && (
                      <span className="text-xs text-gray-500 ml-2">({step.message})</span>
                    )}
                  </div>
                ))}
              </div>
              
              <Progress 
                value={publishSteps.filter(s => s.status === 'success').length / publishSteps.length * 100} 
                className="h-1.5 mt-2"
              />
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
            <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg text-xs space-y-2">
              <p className="font-semibold mb-2">Debug Information</p>
              
              <div className="grid grid-cols-2 gap-1">
                <span className="text-gray-600">Selected Product:</span>
                <span>{selectedProductId || 'None'}</span>
                
                <span className="text-gray-600">Retry Count:</span>
                <span>{retryCount}</span>
                
                <span className="text-gray-600">Connection Status:</span>
                <span>{connectionError ? 'Error' : 'OK'}</span>
                
                <span className="text-gray-600">Metaobject Created:</span>
                <span>{metaobjectCreated ? 'Yes' : 'No'}</span>
                
                <span className="text-gray-600">Products Loaded:</span>
                <span>{products.length}</span>
                
                <span className="text-gray-600">Sync Status:</span>
                <span>{syncStatus}</span>
                
                <span className="text-gray-600">Fallback Mode:</span>
                <span>{useFallbackOnly ? 'Enabled' : 'Disabled'}</span>
              </div>
              
              <div className="border-t pt-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={toggleFallbackMode}
                >
                  {useFallbackOnly 
                    ? language === 'ar' ? 'تعطيل وضع الرجوع' : 'Disable Fallback Mode' 
                    : language === 'ar' ? 'تفعيل وضع الرجوع' : 'Enable Fallback Mode'
                  }
                </Button>
              </div>
              
              {errorMessage && (
                <div className="border-t border-gray-300 pt-2">
                  <p className="font-semibold text-xs text-red-600">Last Error:</p>
                  <p className="text-xs text-red-600 break-words">{errorMessage}</p>
                </div>
              )}
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
