import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';
import { Store, LoaderCircle, Eye, ExternalLink, RefreshCw, Info } from 'lucide-react';
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
  const { isConnected, shop } = useShopify();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'not_synced' | 'syncing' | 'synced'>('not_synced');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [syncedUrl, setSyncedUrl] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [productData, setProductData] = useState<any>(null);
  
  useEffect(() => {
    if (pageId) {
      checkSyncStatus();
      fetchPageProduct();
    }
  }, [pageId]);
  
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
        .single();
        
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
      
      // Call our API to get product details
      const { data, error } = await supabase.functions.invoke('shopify-products', {
        body: { 
          shop,
          productId
        }
      });
      
      if (error) throw error;
      
      if (data?.product) {
        setProductData(data.product);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
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
    
    setIsSyncing(true);
    setSyncStatus('syncing');
    
    try {
      // Call the API to publish the landing page to Shopify
      const { data, error } = await supabase.functions.invoke('shopify-publish-page', {
        body: { 
          pageId,
          pageSlug,
          shop,
          productId // Send the product ID to link with the product page
        }
      });
      
      if (error) throw error;
      
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
        throw new Error(data?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error publishing to Shopify:', error);
      setSyncStatus('not_synced');
      toast.error(language === 'ar' 
        ? 'خطأ في نشر الصفحة على شوبيفاي' 
        : 'Error publishing to Shopify');
    } finally {
      setIsSyncing(false);
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
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        {language === 'ar'
          ? 'انشر صفحة الهبوط هذه في متجر شوبيفاي الخاص بك وقم بتطبيقها على صفحة المنتج'
          : 'Publish this landing page to your Shopify store and apply it to the product page'}
      </p>
      
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
        <Alert className="mb-4 bg-blue-50">
          <AlertDescription>
            {language === 'ar'
              ? 'لم يتم تحديد منتج لهذه الصفحة. يرجى تحديد منتج أولاً في إعدادات الصفحة.'
              : 'No product has been selected for this page. Please select a product first in the page settings.'}
          </AlertDescription>
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
            <Store className="h-4 w-4 mr-1" />
            {language === 'ar'
              ? 'تم النشر على شوبيفاي'
              : 'Published to Shopify'}
          </div>
          
          <Button
            variant="default"
            onClick={handleSync}
            disabled={isSyncing || !isPublished}
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
            disabled={isSyncing || !isPublished}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جاري النشر...' : 'Publishing...'}
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
    </div>
  );
};

export default ShopifyLandingPageSync;
