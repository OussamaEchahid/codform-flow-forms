
import React, { useEffect, useState } from 'react';
import FormsPage from './FormsPage';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { logShopifyDiagnostics, logFormDiagnostics, resetShopifyConnection } from '@/utils/diagnostics';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const Forms = () => {
  const { shopDomain, isConnected, isLoading, syncState, reload } = useShopifyConnection();
  const [hasSynced, setHasSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [emergencyReset, setEmergencyReset] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  
  // Run diagnostics on component mount
  useEffect(() => {
    // Log diagnostics data for debugging
    console.log('Forms page mounted. Running diagnostics...');
    logShopifyDiagnostics();
    logFormDiagnostics(supabase, shopDomain);
    
    // Force all caches to be cleared and re-initialized
    localStorage.removeItem('forms_cache');
    localStorage.removeItem('shopify_forms');
    localStorage.setItem('forms_last_reload', Date.now().toString());
  }, [shopDomain]);
  
  // Force a sync before rendering forms
  useEffect(() => {
    const performSync = async () => {
      if (!hasSynced && !isLoading) {
        console.log('Forms page: Forcing connection sync to ensure fresh data');
        try {
          await syncState();
          setHasSynced(true);
          
          // Double check if we have a shop domain after sync
          if (!shopDomain) {
            const fallbackShopId = localStorage.getItem('shopify_store');
            if (fallbackShopId) {
              console.log('Forms page: Using fallback shop ID from localStorage:', fallbackShopId);
              
              // Double verify this shop exists in the database
              try {
                const { data: shopExists } = await supabase
                  .from('forms')
                  .select('id')
                  .eq('shop_id', fallbackShopId)
                  .limit(1);
                  
                if (shopExists && shopExists.length > 0) {
                  console.log('Forms page: Confirmed shop has forms in database');
                  // Force a re-render after verification to ensure FormsPage uses the correct shop ID
                  setForceRender(prev => prev + 1);
                }
              } catch (verifyErr) {
                console.log('Forms page: Error verifying shop forms:', verifyErr);
              }
            }
          }
        } catch (error) {
          console.error('Error syncing connection state:', error);
          setSyncError('فشل في مزامنة حالة الاتصال، يرجى إعادة تحميل الصفحة');
        }
      }
    };
    
    performSync();
  }, [syncState, isLoading, hasSynced, shopDomain]);

  // Store current shop ID in localStorage immediately when available
  useEffect(() => {
    // Log the connection status for debugging
    console.log('Forms page updated. Shopify connection status:', { 
      isConnected, 
      shopDomain,
      isLoading,
      localStorageShopId: localStorage.getItem('shopify_store'),
      connectionMatch: shopDomain === localStorage.getItem('shopify_store'),
      forceRender
    });
    
    // Store current shop ID in localStorage as a fallback immediately when available
    if (shopDomain) {
      localStorage.setItem('shopify_store', shopDomain);
      console.log('Stored shopDomain in localStorage:', shopDomain);
    }
  }, [isConnected, shopDomain, isLoading, forceRender]);

  const handleReload = async () => {
    try {
      toast.info('جاري إعادة تهيئة الاتصال...');
      await reload();
      setSyncError(null);
      
      // Force reload all forms
      setForceRender(prev => prev + 1);
      
      toast.success('تم إعادة تهيئة الاتصال بنجاح');
    } catch (error) {
      console.error('Error reloading connection:', error);
      toast.error('فشل في إعادة تهيئة الاتصال');
    }
  };

  const handleEmergencyReset = async () => {
    setEmergencyReset(true);
    try {
      // Reset Shopify connection state
      resetShopifyConnection();
      toast.success('تم إعادة تعيين حالة الاتصال، سيتم إعادة تحميل الصفحة');
      
      // Short delay to ensure localStorage changes are saved
      setTimeout(() => {
        window.location.href = '/shopify-connect';
      }, 500);
    } catch (error) {
      console.error('Error during emergency reset:', error);
      setEmergencyReset(false);
      toast.error('حدث خطأ أثناء إعادة التعيين');
    }
  };

  // Show error if sync failed
  if (syncError) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>خطأ في الاتصال</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{syncError}</p>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button onClick={handleReload} variant="outline">
                <RefreshCw className="h-4 w-4 ml-2" />
                إعادة تحميل الصفحة
              </Button>
              <Button onClick={handleEmergencyReset} variant="destructive" disabled={emergencyReset}>
                {emergencyReset ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4 ml-2" />
                )}
                إعادة تعيين اتصال Shopify
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading while we sync
  if (isLoading || !hasSynced) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary ml-2" />
        <span>جاري تحميل المعلومات...</span>
      </div>
    );
  }

  // Pass forceRender to FormsPage to trigger refreshes when needed
  return (
    <FormsPage shopId={shopDomain} key={`forms-${forceRender}`} forceRefresh={forceRender > 0} />
  );
};

export default Forms;
