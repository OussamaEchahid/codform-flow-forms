
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';
import { Store, LoaderCircle, Eye, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  
  useEffect(() => {
    if (pageId) {
      checkSyncStatus();
    }
  }, [pageId]);
  
  const checkSyncStatus = async () => {
    try {
      // التحقق مما إذا كانت هذه الصفحة قد تمت مزامنتها مع Shopify
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
  
  const handleSync = async () => {
    if (!isConnected) {
      toast.error(language === 'ar' 
        ? 'يجب الاتصال بشوبيفاي أولاً' 
        : 'You must connect to Shopify first');
      return;
    }
    
    setIsSyncing(true);
    setSyncStatus('syncing');
    
    try {
      // استدعاء واجهة برمجة التطبيقات الخاصة بـ Shopify لنشر صفحة الهبوط
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
        
        // حفظ عنوان URL للصفحة المنشورة
        if (data?.url) {
          setSyncedUrl(data.url);
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
    
    // فتح صفحة Shopify في علامة تبويب جديدة
    const domain = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
    window.open(`https://${domain}/pages/${pageSlug}`, '_blank');
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
      <h3 className="font-medium mb-2">
        {language === 'ar' ? 'نشر على شوبيفاي' : 'Publish to Shopify'}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        {language === 'ar'
          ? 'انشر صفحة الهبوط هذه كصفحة في متجر شوبيفاي الخاص بك'
          : 'Publish this landing page as a page in your Shopify store'}
      </p>
      
      {/* أزرار المعاينة */}
      <div className="mb-4 border-b pb-4">
        <h4 className="text-sm font-medium mb-2">
          {language === 'ar' ? 'معاينة الصفحة' : 'Preview Page'}
        </h4>
        <div className="flex space-x-2">
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
            <Button
              variant="outline"
              size="sm"
              onClick={viewShopifyPage}
              className="flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'معاينة في شوبيفاي' : 'Shopify Preview'}
            </Button>
          )}
        </div>
      </div>
      
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
            disabled={isSyncing}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
              </>
            ) : (
              <>
                <Store className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تحديث في شوبيفاي' : 'Update on Shopify'}
              </>
            )}
          </Button>
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
      
      {/* استخدام مكون Dialog بشكل صحيح */}
      {isDialogOpen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'تفاصيل النشر على شوبيفاي' : 'Shopify Publishing Details'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                {language === 'ar'
                  ? 'تفاصيل نشر الصفحة على متجر شوبيفاي الخاص بك'
                  : 'Details about publishing this page to your Shopify store'}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsDialogOpen(false)}>
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ShopifyLandingPageSync;
