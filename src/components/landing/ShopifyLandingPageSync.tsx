
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';
import { Store, LoaderCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  
  useEffect(() => {
    if (pageId) {
      checkSyncStatus();
    }
  }, [pageId]);
  
  const checkSyncStatus = async () => {
    try {
      // Check if this page has been synced to Shopify
      const { data, error } = await supabase
        .from('shopify_page_syncs')
        .select('id, synced_url')
        .eq('page_id', pageId)
        .limit(1);
        
      if (!error && data && data.length > 0) {
        setSyncStatus('synced');
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };
  
  const handleSync = async () => {
    if (!isConnected) {
      toast.error(language === 'ar' 
        ? 'يجب الاتصال بشوبيفاي أولاً' 
        : 'You must connect to Shopify first');
      return;
    }
    
    // No need to check for local publishing status
    // We're publishing directly to Shopify
    
    setIsSyncing(true);
    setSyncStatus('syncing');
    
    try {
      // Call Shopify API to publish the landing page
      const { data, error } = await supabase.functions.invoke('shopify-publish-page', {
        body: { 
          pageId,
          pageSlug,
          shop
        }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(language === 'ar' 
          ? 'تم نشر الصفحة على شوبيفاي بنجاح' 
          : 'Page published to Shopify successfully');
        setSyncStatus('synced');
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
    
    // Open the Shopify page in a new tab
    const domain = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
    window.open(`https://${domain}/pages/${pageSlug}`, '_blank');
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
      <h3 className="font-medium mb-2">
        {language === 'ar' ? 'نشر على شوبيفاي' : 'Publish to Shopify'}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        {language === 'ar'
          ? 'انشر صفحة الهبوط هذه كصفحة في متجر شوبيفاي الخاص بك'
          : 'Publish this landing page as a page in your Shopify store'}
      </p>
      
      {syncStatus === 'synced' ? (
        <div className="space-y-2">
          <div className="flex items-center text-green-600 text-sm">
            <Store className="h-4 w-4 mr-1" />
            {language === 'ar'
              ? 'تم النشر على شوبيفاي'
              : 'Published to Shopify'}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={viewShopifyPage}
            >
              {language === 'ar' ? 'عرض الصفحة' : 'View Page'}
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                </>
              ) : (
                language === 'ar' ? 'تحديث الصفحة' : 'Update Page'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={handleSync}
          disabled={isSyncing}
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
      )}
    </div>
  );
};

export default ShopifyLandingPageSync;
