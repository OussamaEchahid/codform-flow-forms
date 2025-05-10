import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Upload, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useShopify } from '@/hooks/useShopify';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';

interface ShopifyFormSyncProps {
  formId: string;
}

const ShopifyFormSync: React.FC<ShopifyFormSyncProps> = ({ formId }) => {
  const { language } = useI18n();
  const { shop, refreshConnection } = useShopify();
  const { testConnection } = useShopifyConnection();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncsCount, setSyncsCount] = useState<number>(0);
  const [isFormPublished, setIsFormPublished] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConnectionCheck, setLastConnectionCheck] = useState<number>(0);

  // IMPROVED: Better form status checking with memory caching
  const checkFormStatus = useCallback(async () => {
    if (!formId) return false;
    
    try {
      console.log('Checking form status for ID:', formId);
      // Use a more efficient query with only the needed fields
      const { data, error } = await supabase
        .from('forms')
        .select('is_published, shop_id')
        .eq('id', formId)
        .single();
        
      if (error) {
        console.error('Error checking form publication status:', error);
        return false;
      }
      
      const isPublished = data?.is_published || false;
      setIsFormPublished(isPublished);
      console.log('Form publication status:', isPublished, 'Shop ID:', data?.shop_id);
      
      // Return the publication status
      return isPublished;
    } catch (e) {
      console.error('Error checking form status:', e);
      return false;
    }
  }, [formId]);

  // Load initial data and sync status on component mount
  useEffect(() => {
    // Check form publication status
    checkFormStatus();

    // Check for last sync information
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
  }, [formId, checkFormStatus]);

  // IMPROVED: Enhanced form synchronization with better error handling and performance
  const handleSync = async () => {
    if (!formId || !shop) {
      toast.error(language === 'ar' ? 'يجب حفظ النموذج أولاً' : 'Please save the form first');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');
    setErrorMessage(null);

    try {
      // First verify connection with cache to prevent excessive checks
      const now = Date.now();
      const shouldRefreshConnection = now - lastConnectionCheck > 60000; // Check if more than 1 minute since last check
      
      let connectionValid = false;
      if (shouldRefreshConnection) {
        console.log('Testing Shopify connection (forced refresh)');
        connectionValid = await testConnection(true);
        setLastConnectionCheck(now);
      } else {
        console.log('Testing Shopify connection (cached check)');
        connectionValid = await testConnection(false);
      }
      
      if (!connectionValid) {
        const errorMsg = language === 'ar' 
          ? 'فشل الاتصال بـ Shopify. يرجى تحديث رمز الوصول أولاً' 
          : 'Shopify connection failed. Please update your access token first';
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
        setIsSyncing(false);
        setSyncStatus('error');
        return;
      }

      // First ensure the form is published and linked to the shop
      const { error: publishError } = await supabase
        .from('forms')
        .update({ 
          is_published: true,
          shop_id: shop
        })
        .eq('id', formId);
        
      if (publishError) {
        console.error('Error publishing form:', publishError);
        toast.error(language === 'ar' ? 'خطأ في نشر النموذج' : 'Error publishing the form');
        setIsSyncing(false);
        setSyncStatus('error');
        return;
      }
      
      // Update the form status after successful publication
      setIsFormPublished(true);

      // Get access token for the current shop
      const { data: tokenData, error: tokenError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
        
      if (tokenError || !tokenData?.access_token) {
        console.error('Error getting access token:', tokenError);
        setErrorMessage(language === 'ar' ? 'خطأ في الحصول على رمز الوصول' : 'Error getting access token');
        toast.error(language === 'ar' ? 'خطأ في الحصول على رمز الوصول' : 'Error getting access token');
        setIsSyncing(false);
        setSyncStatus('error');
        return;
      }

      // IMPROVED: Add retry mechanism and better caching control
      const maxRetries = 2;
      let currentRetry = 0;
      let syncSuccess = false;
      let syncResponse = null;
      
      while (currentRetry <= maxRetries && !syncSuccess) {
        try {
          // Call the Supabase edge function with better retry/cache control
          const { data, error } = await supabase.functions.invoke('shopify-sync-form', {
            body: {
              formId: formId,
              shop: shop,
              accessToken: tokenData.access_token,
              // Add timestamp and unique ID to avoid caching issues
              timestamp: Date.now(),
              requestId: `sync_${Math.random().toString(36).substring(2, 10)}`,
              retryNumber: currentRetry
            },
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (error) throw error;
          syncResponse = data;
          
          // If we got a successful response, break out of the retry loop
          if (data?.success) {
            syncSuccess = true;
            break;
          } else {
            // If the response was not successful but we didn't get an error, still consider it failed
            throw new Error(data?.message || 'Sync failed without specific error');
          }
        } catch (retryError) {
          currentRetry++;
          console.error(`Sync attempt ${currentRetry}/${maxRetries} failed:`, retryError);
          
          // If we haven't exhausted our retries, wait before trying again
          if (currentRetry <= maxRetries && !syncSuccess) {
            const delay = Math.pow(2, currentRetry) * 1000; // Exponential backoff
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      if (syncSuccess) {
        const newSyncsCount = syncsCount + 1;
        const currentTime = new Date().toLocaleString();
        
        // Check returned publication status
        setIsFormPublished(syncResponse.published_status || true);
        
        // Save sync info to localStorage
        const syncInfo = {
          lastSynced: currentTime,
          count: newSyncsCount,
          status: 'success'
        };
        localStorage.setItem(`form_sync_${formId}`, JSON.stringify(syncInfo));
        
        setSyncStatus('success');
        setLastSynced(currentTime);
        setSyncsCount(newSyncsCount);
        toast.success(language === 'ar' ? 'تم مزامنة النموذج بنجاح' : 'Form synced successfully');
        
        // Force refresh form status
        await checkFormStatus();
      } else {
        // All retries failed
        const errorMsg = syncResponse?.message || 
          (language === 'ar' ? 'فشلت جميع محاولات المزامنة. يرجى المحاولة مرة أخرى لاحقًا.' : 
          'All sync attempts failed. Please try again later.');
          
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
        setSyncStatus('error');
        
        // Save error status
        localStorage.setItem(`form_sync_${formId}`, JSON.stringify({
          lastSynced: lastSynced,
          count: syncsCount,
          status: 'error'
        }));
      }
    } catch (error) {
      console.error('Error syncing form:', error);
      const errorMsg = error instanceof Error ? error.message : (language === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected error');
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  // IMPROVED: Better reconnection handling with feedback
  const handleReconnect = async () => {
    setIsReconnecting(true);
    setErrorMessage(null);
    try {
      console.log('Attempting to reconnect to Shopify...');
      
      // Call refreshConnection with true to force refresh
      const success = await refreshConnection(true);
      
      if (success) {
        toast.success(language === 'ar' ? 'تم إعادة الاتصال بنجاح' : 'Successfully reconnected');
        setLastConnectionCheck(Date.now());
        
        // Try sync again after reconnection
        await handleSync();
      } else {
        const errorMsg = language === 'ar' ? 'فشل إعادة الاتصال' : 'Failed to reconnect';
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error reconnecting:', error);
      const errorMsg = error instanceof Error ? error.message : (language === 'ar' ? 'حدث خطأ أثناء إعادة الاتصال' : 'Error during reconnection');
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsReconnecting(false);
    }
  };

  // IMPROVED: Smarter connection verification
  const handleRetryConnection = async () => {
    setIsReconnecting(true);
    setErrorMessage(null);
    try {
      console.log('Testing Shopify connection with forced refresh...');
      
      // Use testConnection with explicit true to force refresh
      const success = await testConnection(true);
      setLastConnectionCheck(Date.now());
      
      if (success) {
        toast.success(language === 'ar' ? 'تم تجديد الاتصال بنجاح' : 'Connection refreshed successfully');
        // Clear error if successful
        setSyncStatus('idle');
      } else {
        const errorMsg = language === 'ar' ? 'فشل تجديد الاتصال' : 'Connection refresh failed';
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error retrying connection:', error);
      const errorMsg = error instanceof Error ? error.message : (language === 'ar' ? 'حدث خطأ أثناء تجديد الاتصال' : 'Error refreshing connection');
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <Card className="w-full border border-gray-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              {language === 'ar' ? 'م��امنة Shopify' : 'Shopify Synchronization'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'مزامنة النموذج مع متجر Shopify الخاص بك'
                : 'Sync this form with your Shopify store'}
            </CardDescription>
          </div>
          
          {syncStatus === 'success' && (
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center gap-1 px-2 py-1">
              <CheckCircle className="h-3 w-3" />
              {language === 'ar' ? 'تمت المزامنة' : 'Synced'}
            </Badge>
          )}
          
          {syncStatus === 'error' && (
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1 px-2 py-1">
              <AlertCircle className="h-3 w-3" />
              {language === 'ar' ? 'فشلت المزامنة' : 'Sync Failed'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                {shop ? (
                  <p className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {language === 'ar'
                      ? `متصل بـ: ${shop}`
                      : `Connected to: ${shop}`}
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {language === 'ar'
                      ? 'لم يتم العثور على متجر متصل'
                      : 'No connected store found'}
                  </p>
                )}
                
                <p className="text-sm mt-1">
                  <span className={isFormPublished ? "text-green-600" : "text-amber-600"}>
                    {isFormPublished 
                      ? (language === 'ar' ? '✓ النموذج منشور' : '✓ Form is published') 
                      : (language === 'ar' ? '⚠️ النموذج غير منشور' : '⚠️ Form not published')}
                  </span>
                </p>
                
                {lastSynced && (
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'ar'
                      ? `آخر مزامنة: ${lastSynced}`
                      : `Last synced: ${lastSynced}`}
                  </p>
                )}
                
                {syncsCount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'ar'
                      ? `عدد مرات المزامنة: ${syncsCount}`
                      : `Sync count: ${syncsCount}`}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col items-end">
                <div className={`text-sm font-medium ${syncStatus === 'success' ? 'text-green-600' : 'text-gray-500'}`}>
                  {syncStatus === 'success' ? (
                    language === 'ar' ? 'متزامن' : 'In sync'
                  ) : (
                    language === 'ar' ? 'غير متزامن' : 'Not synced'
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {language === 'ar'
                    ? 'يجب المزامنة بعد التغييرات'
                    : 'Sync needed after changes'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleSync}
              disabled={isSyncing || !shop || !formId}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : syncStatus === 'success' ? (
                <RefreshCw className="h-4 w-4 mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {language === 'ar' ? 'مزامنة النموذج' : 'Sync Form'}
            </Button>
            
            <Button
              onClick={handleRetryConnection}
              disabled={isReconnecting}
              variant="outline"
              className="w-full"
            >
              {isReconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {language === 'ar' ? 'تجديد الاتصال' : 'Refresh Connection'}
            </Button>
            
            {syncStatus === 'error' && (
              <Button
                onClick={handleReconnect}
                disabled={isReconnecting}
                variant="secondary"
                className="w-full"
              >
                {isReconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                {language === 'ar' ? 'إعادة الاتصال بـ Shopify' : 'Reconnect to Shopify'}
              </Button>
            )}
          </div>
          
          {syncStatus === 'success' && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 mt-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {language === 'ar'
                      ? 'تم مزامنة النموذج بنجاح مع متجرك'
                      : 'Form successfully synced with your store'}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {language === 'ar'
                      ? 'سيظهر النموذج الآن في صفحة المنتج في متجرك'
                      : 'Your form will now appear on your store product page'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {syncStatus === 'error' && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-100 mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {language === 'ar'
                      ? 'حدث خطأ أثناء مزامنة النموذج'
                      : 'Error syncing form with your store'}
                  </p>
                  {errorMessage && (
                    <p className="text-xs text-red-700 mt-1 font-medium">
                      {errorMessage}
                    </p>
                  )}
                  <p className="text-xs text-red-600 mt-1">
                    {language === 'ar'
                      ? 'يرجى التأكد من أنك متصل بمتجر Shopify الخاص بك والمحاولة مرة أخرى. جرب تحديث الاتصال أولاً.'
                      : 'Please ensure you are connected to your Shopify store and try again. Try refreshing connection first.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyFormSync;
