
import React, { useEffect, useState } from 'react';
import FormsPage from './FormsPage';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { logShopifyDiagnostics, logFormDiagnostics, resetShopifyConnection } from '@/utils/diagnostics';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { normalizeFormData } from '@/lib/form-utils/standardizeFormData';

const Forms = () => {
  const { shopDomain, isConnected, isLoading, syncState, reload } = useShopifyConnection();
  const [hasSynced, setHasSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [emergencyReset, setEmergencyReset] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  console.log("Forms component rendering. Shop domain:", shopDomain, "isConnected:", isConnected);
  
  // Run diagnostics on component mount
  useEffect(() => {
    // Force remove recovery mode - CRITICAL FIX
    localStorage.removeItem('shopify_recovery_mode');
    
    // Log diagnostics data for debugging
    console.log('Forms page mounted. Running diagnostics...');
    logShopifyDiagnostics();
    logFormDiagnostics(supabase, shopDomain);
    
    // Force all caches to be cleared and re-initialized
    localStorage.removeItem('forms_cache');
    localStorage.removeItem('shopify_forms');
    localStorage.setItem('forms_last_reload', Date.now().toString());
    
    // Set initial load complete after a short delay
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 1000);
    
    return () => clearTimeout(timer);
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
              
              // Double verify this shop exists in the database - but no blocking
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

  // Added new method to fix any existing forms in the database with incorrect structure
  const fixExistingForms = async () => {
    try {
      const shopId = shopDomain || localStorage.getItem('shopify_store');
      if (!shopId) return;
      
      // Get all forms for this shop
      const { data: allForms, error } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', shopId);
        
      if (error || !allForms) {
        console.error('Error fetching forms for fix:', error);
        return;
      }
      
      // Loop through forms and fix data structure if needed
      for (const form of allForms) {
        try {
          // Check if the data structure needs fixing
          let needsFix = false;
          
          if (!form.data || typeof form.data !== 'object') {
            needsFix = true;
          } else if (!form.data.steps && !Array.isArray(form.data)) {
            needsFix = true;
          }
          
          if (needsFix) {
            console.log('Fixing form structure for form:', form.id);
            // Normalize the data
            const normalizedSteps = normalizeFormData(form.data);
            
            // Update the form with the new structure
            await supabase
              .from('forms')
              .update({
                data: { steps: normalizedSteps }
              })
              .eq('id', form.id);
              
            console.log('Fixed form structure for form:', form.id);
          }
        } catch (formErr) {
          console.error('Error fixing form:', form.id, formErr);
        }
      }
      
      console.log('Completed form structure fix attempt');
    } catch (e) {
      console.error('Error in fixExistingForms:', e);
    }
  };

  // Run form fix on initial load
  useEffect(() => {
    if (hasSynced && !isLoading && shopDomain) {
      fixExistingForms().catch(err => {
        console.error('Failed to fix forms:', err);
      });
    }
  }, [hasSynced, isLoading, shopDomain]);

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
      
      // Clear all localStorage items that might affect connection
      localStorage.removeItem('shopify_recovery_mode');
      localStorage.setItem('shopify_sync_attempts', '0');
      
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

  const handleFullReset = () => {
    // Perform a complete reset of all connection and form data
    try {
      localStorage.clear();
      sessionStorage.clear();
      toast.success('تم مسح جميع البيانات المحلية، سيتم إعادة تحميل الصفحة');
      
      // Short delay to ensure changes are saved
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Error during full reset:', error);
      toast.error('حدث خطأ أثناء إعادة التعيين الكامل');
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
              <Button onClick={handleFullReset} variant="destructive" className="bg-red-700">
                إعادة تعيين كاملة للتطبيق
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading while we sync
  if ((isLoading || !hasSynced) && !initialLoadComplete) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary ml-2" />
        <span>جاري تحميل المعلومات...</span>
      </div>
    );
  }

  // Pass forceRender to FormsPage to trigger refreshes when needed
  return (
    <FormsPage 
      shopId={shopDomain} 
      key={`forms-${forceRender}`} 
      forceRefresh={forceRender > 0}
      onReset={handleFullReset}
    />
  );
};

export default Forms;
