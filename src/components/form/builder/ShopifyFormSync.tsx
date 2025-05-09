
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Upload, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useShopify } from '@/hooks/useShopify';

interface ShopifyFormSyncProps {
  formId: string;
}

const ShopifyFormSync: React.FC<ShopifyFormSyncProps> = ({ formId }) => {
  const { language } = useI18n();
  const { shop, testConnection, refreshConnection } = useShopify();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncsCount, setSyncsCount] = useState<number>(0);
  const [isFormPublished, setIsFormPublished] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    // Check form publication status
    const checkFormStatus = async () => {
      if (!formId) return;
      
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('is_published')
          .eq('id', formId)
          .single();
          
        if (error) {
          console.error('Error checking form publication status:', error);
          return;
        }
        
        setIsFormPublished(data?.is_published || false);
        console.log('Form publication status:', data?.is_published);
        
        // If form is not published, auto-publish it
        if (data && !data.is_published && shop) {
          console.log('Auto-publishing form for Shopify compatibility');
          handleSync();
        }
      } catch (e) {
        console.error('Error checking form status:', e);
      }
    };

    // Check for last sync information in localStorage
    const storedSyncInfo = localStorage.getItem(`form_sync_${formId}`);
    if (storedSyncInfo) {
      try {
        const syncInfo = JSON.parse(storedSyncInfo);
        setLastSynced(syncInfo.lastSynced);
        setSyncsCount(syncInfo.count || 0);
        if (syncInfo.status) {
          setSyncStatus(syncInfo.status);
        }
      } catch (e) {
        console.error('Error parsing sync info:', e);
      }
    }
    
    checkFormStatus();
  }, [formId, shop]);

  const handleSync = async () => {
    if (!formId || !shop) {
      toast.error(language === 'ar' ? 'يجب حفظ النموذج أولاً' : 'Please save the form first');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      // First verify connection - using testConnection with a boolean parameter (false for regular check)
      const connectionValid = await testConnection(false);
      
      if (!connectionValid) {
        toast.error(language === 'ar' ? 'فشل الاتصال بـ Shopify. يرجى تحديث الاتصال أولاً' : 'Shopify connection failed. Please refresh connection first');
        setIsSyncing(false);
        setSyncStatus('error');
        return;
      }

      // First ensure the form is published
      const { error: publishError } = await supabase
        .from('forms')
        .update({ 
          is_published: true,
          shop_id: shop  // Make sure shop_id is also updated
        })
        .eq('id', formId);
        
      if (publishError) {
        console.error('Error publishing form:', publishError);
        toast.error(language === 'ar' ? 'خطأ في نشر النموذج' : 'Error publishing the form');
        setIsSyncing(false);
        return;
      }

      // Get access token for the current shop
      const { data: tokenData, error: tokenError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
        
      if (tokenError || !tokenData?.access_token) {
        console.error('Error getting access token:', tokenError);
        toast.error(language === 'ar' ? 'خطأ في الحصول على رمز الوصول' : 'Error getting access token');
        setIsSyncing(false);
        setSyncStatus('error');
        return;
      }

      // Call the Supabase edge function to sync the form with Shopify
      const { data, error } = await supabase.functions.invoke('shopify-sync-form', {
        body: {
          formId,
          shop,
          accessToken: tokenData.access_token,
          position: 'product-page' // Default position
        }
      });

      if (error) {
        console.error('Error syncing form with Shopify:', error);
        toast.error(language === 'ar' ? 'فشل في مزامنة النموذج مع Shopify' : 'Failed to sync form with Shopify');
        setSyncStatus('error');
        setIsSyncing(false);
        return;
      }

      if (!data || !data.success) {
        const errorMsg = data?.message || 'Unknown error';
        console.error('Sync response error:', errorMsg);
        toast.error(language === 'ar' ? `فشل في المزامنة: ${errorMsg}` : `Sync failed: ${errorMsg}`);
        setSyncStatus('error');
        setIsSyncing(false);
        return;
      }

      // Update sync info in localStorage
      const now = new Date().toISOString();
      const newCount = syncsCount + 1;
      
      localStorage.setItem(`form_sync_${formId}`, JSON.stringify({
        lastSynced: now,
        count: newCount,
        status: 'success'
      }));
      
      setLastSynced(now);
      setSyncsCount(newCount);
      setSyncStatus('success');
      toast.success(language === 'ar' ? 'تمت مزامنة النموذج بنجاح مع متجر Shopify' : 'Form successfully synced with Shopify store');
      
      // Ensure the form is marked as published in state
      setIsFormPublished(true);
    } catch (err) {
      console.error('Unexpected error during sync:', err);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء المزامنة' : 'An error occurred during sync');
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      // Call refreshConnection without arguments
      const success = await refreshConnection();
      if (success) {
        toast.success(language === 'ar' ? 'تم إعادة الاتصال بنجاح' : 'Successfully reconnected');
        handleSync(); // Try syncing again after reconnection
      } else {
        toast.error(language === 'ar' ? 'فشل إعادة الاتصال' : 'Reconnection failed');
      }
    } catch (error) {
      console.error('Error reconnecting:', error);
      toast.error(language === 'ar' ? 'خطأ في إعادة الاتصال' : 'Error reconnecting');
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleRetryConnection = async () => {
    setIsReconnecting(true);
    try {
      // Use testConnection with a boolean parameter set to true to force refresh
      const success = await testConnection(true);
      if (success) {
        toast.success(language === 'ar' ? 'تم تجديد الاتصال بنجاح' : 'Connection refreshed successfully');
        handleSync(); // Try syncing again after connection refresh
      } else {
        toast.error(language === 'ar' ? 'فشل تجديد الاتصال' : 'Connection refresh failed');
      }
    } catch (error) {
      console.error('Error refreshing connection:', error);
      toast.error(language === 'ar' ? 'خطأ في تجديد الاتصال' : 'Error refreshing connection');
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <div className="flex-1">
            {language === 'ar' ? 'مزامنة النموذج مع Shopify' : 'Shopify Form Sync'}
          </div>
          {shop && (
            <Badge variant="outline" className="ml-2">
              {shop}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {language === 'ar'
            ? 'مزامنة هذا النموذج مع متجر Shopify الخاص بك لعرضه على صفحات المنتج'
            : 'Sync this form with your Shopify store to display it on product pages'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!shop ? (
          <div className="flex flex-col items-center p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="h-6 w-6 text-yellow-500 mb-2" />
            <p className="text-center text-yellow-700 mb-2">
              {language === 'ar'
                ? 'لم يتم الاتصال بمتجر Shopify'
                : 'Not connected to a Shopify store'}
            </p>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/shopify'}
              className="mt-2"
            >
              {language === 'ar' ? 'الاتصال الآن' : 'Connect Now'}
            </Button>
          </div>
        ) : syncStatus === 'success' ? (
          <div className="flex flex-col">
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-md mb-4">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <div>
                <p className="text-green-800">
                  {language === 'ar' 
                    ? 'تمت المزامنة بنجاح مع متجر Shopify' 
                    : 'Successfully synced with Shopify store'}
                </p>
                {lastSynced && (
                  <p className="text-green-600 text-sm">
                    {language === 'ar' 
                      ? `آخر تحديث: ${new Date(lastSynced).toLocaleString()}` 
                      : `Last updated: ${new Date(lastSynced).toLocaleString()}`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                variant="outline"
                size="sm"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'ar' ? 'جاري المزامنة...' : 'Syncing...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'إعادة المزامنة' : 'Resync'}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : syncStatus === 'error' ? (
          <div className="flex flex-col">
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md mb-4">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <div>
                <p className="text-red-800">
                  {language === 'ar' 
                    ? 'فشلت المزامنة مع متجر Shopify' 
                    : 'Failed to sync with Shopify store'}
                </p>
                <p className="text-red-600 text-sm">
                  {language === 'ar' 
                    ? 'يرجى التحقق من اتصال Shopify والمحاولة مرة أخرى' 
                    : 'Please check your Shopify connection and try again'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                onClick={handleRetryConnection}
                disabled={isReconnecting}
                variant="outline"
                size="sm"
              >
                {isReconnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'ar' ? 'جاري التحقق...' : 'Checking...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'تحديث الاتصال' : 'Refresh Connection'}
                  </>
                )}
              </Button>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                size="sm"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'ar' ? 'جاري المزامنة...' : 'Syncing...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <p className="mb-4">
              {language === 'ar'
                ? 'مزامنة هذا النموذج مع متجر Shopify الخاص بك سيسمح بعرضه على صفحات المنتج.'
                : 'Syncing this form with your Shopify store will allow it to be displayed on product pages.'}
            </p>
            <div className="flex justify-end">
              <Button
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'ar' ? 'جاري المزامنة...' : 'Syncing...'}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'مزامنة مع Shopify' : 'Sync with Shopify'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShopifyFormSync;
