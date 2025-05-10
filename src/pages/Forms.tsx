
import React, { useEffect, useState, useRef } from 'react';
import FormsPage from './FormsPage';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { logShopifyDiagnostics, logFormDiagnostics, resetShopifyConnection } from '@/utils/diagnostics';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { normalizeFormData, standardizeFormData } from '@/lib/form-utils/standardizeFormData';

const Forms = () => {
  const { shopDomain, isConnected, isLoading, syncState, reload } = useShopifyConnection();
  const [hasSynced, setHasSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [emergencyReset, setEmergencyReset] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Stable instance ID to avoid infinite rerenders
  const instanceId = useRef(`forms-${Math.random().toString(36).substr(2, 8)}`);
  
  console.log(`[${instanceId.current}] Forms component rendering. Shop domain:`, shopDomain, "isConnected:", isConnected);
  
  // Run diagnostics on component mount only once
  useEffect(() => {
    // Only run once
    if (initialLoadComplete) return;
    
    // Force remove recovery mode
    localStorage.removeItem('shopify_recovery_mode');
    
    console.log(`[${instanceId.current}] Forms page mounted for first time. Running diagnostics...`);
    logShopifyDiagnostics();
    logFormDiagnostics(supabase, shopDomain);
    
    // Force all caches to be cleared only on first load
    localStorage.removeItem('forms_cache');
    localStorage.removeItem('shopify_forms');
    localStorage.setItem('forms_last_reload', Date.now().toString());
    
    // Set initial load complete
    setTimeout(() => {
      setInitialLoadComplete(true);
    }, 1000);
  }, []); // Empty dependency array means this runs once
  
  // Force a sync ONCE
  useEffect(() => {
    const performSync = async () => {
      if (!hasSynced && !isLoading) {
        console.log(`[${instanceId.current}] Forms page: Forcing connection sync once`);
        try {
          await syncState();
          setHasSynced(true);
          
          // Store current shop ID in localStorage immediately when available
          if (shopDomain) {
            localStorage.setItem('shopify_store', shopDomain);
            console.log(`[${instanceId.current}] Stored shopDomain in localStorage:`, shopDomain);
          }
        } catch (error) {
          console.error(`[${instanceId.current}] Error syncing connection state:`, error);
          setSyncError('فشل في مزامنة حالة الاتصال، يرجى إعادة تحميل الصفحة');
        }
      }
    };
    
    performSync();
  }, [syncState, isLoading, hasSynced, shopDomain]);

  // Form structure fix - run only once and with a much longer delay
  useEffect(() => {
    if (hasSynced && !isLoading && shopDomain && initialLoadComplete) {
      // Only run once ever per session
      const hasFixedForms = sessionStorage.getItem('forms_fixed');
      if (hasFixedForms) {
        console.log(`[${instanceId.current}] Forms already fixed this session, skipping`);
        return;
      }
      
      // Add much longer delay (5 seconds) to avoid conflicts
      const fixTimer = setTimeout(() => {
        console.log(`[${instanceId.current}] Running form structure fix after delay...`);
        fixExistingForms().then(() => {
          // Mark as fixed in this session
          sessionStorage.setItem('forms_fixed', 'true');
        }).catch(err => {
          console.error(`[${instanceId.current}] Failed to fix forms:`, err);
        });
      }, 5000);
      
      return () => clearTimeout(fixTimer);
    }
  }, [hasSynced, isLoading, shopDomain, initialLoadComplete]);

  // IMPROVED: Optimized method to fix forms without causing unnecessary refreshes
  const fixExistingForms = async () => {
    try {
      console.log(`[${instanceId.current}] Starting form structure fix`);
      const shopId = shopDomain || localStorage.getItem('shopify_store');
      if (!shopId) {
        console.error(`[${instanceId.current}] No shop ID found for fixing forms`);
        return;
      }
      
      // Get all forms for this shop
      const { data: allForms, error } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', shopId);
        
      if (error || !allForms) {
        console.error(`[${instanceId.current}] Error fetching forms for fix:`, error);
        return;
      }
      
      console.log(`[${instanceId.current}] Found ${allForms.length} forms to check for structure issues`);
      
      // Count how many forms need fixing
      let fixedCount = 0;
      
      // Loop through forms and fix data structure consistently
      for (const form of allForms) {
        try {
          // Check if the data structure needs fixing
          let needsFix = false;
          
          if (!form.data || typeof form.data !== 'object') {
            needsFix = true;
          } else if (!form.data.settings || !form.data.steps) {
            needsFix = true;
          }
          
          if (needsFix) {
            console.log(`[${instanceId.current}] Fixing form structure for form:`, form.id);
            
            // Extract style properties from existing data
            const formStyle = {
              primaryColor: form.primaryColor || '#9b87f5',
              borderRadius: form.borderRadius || '0.5rem',
              fontSize: form.fontSize || '1rem',
              buttonStyle: form.buttonStyle || 'rounded'
            };
            
            // Extract submit button text
            const submitButtonText = form.submitbuttontext || 'إرسال الطلب';
            
            // Get fields from existing form data
            let fields = [];
            
            if (form.data) {
              // Extract fields based on data structure
              if (Array.isArray(form.data)) {
                fields = form.data.flatMap(step => step.fields || []);
              } else if (form.data.steps && Array.isArray(form.data.steps)) {
                fields = form.data.steps.flatMap(step => step.fields || []);
              } else if (typeof form.data === 'object') {
                if (form.data.fields && Array.isArray(form.data.fields)) {
                  fields = form.data.fields;
                }
              }
            }
            
            // Create standardized form structure
            const standardizedData = standardizeFormData(fields, formStyle, submitButtonText);
            
            // Update the form with the new structure
            const { error: updateError } = await supabase
              .from('forms')
              .update({
                data: standardizedData,
                // Also update these fields to match the style properties
                primaryColor: formStyle.primaryColor,
                borderRadius: formStyle.borderRadius,
                fontSize: formStyle.fontSize,
                buttonStyle: formStyle.buttonStyle,
                submitbuttontext: submitButtonText
              })
              .eq('id', form.id);
              
            if (updateError) {
              console.error(`[${instanceId.current}] Error updating form ${form.id}:`, updateError);
            } else {
              console.log(`[${instanceId.current}] Fixed form structure for form: ${form.id}`);
              fixedCount++;
            }
          }
        } catch (formErr) {
          console.error(`[${instanceId.current}] Error fixing form ${form.id}:`, formErr);
        }
      }
      
      console.log(`[${instanceId.current}] Completed form structure fix. Fixed ${fixedCount} forms`);
      
      // Only force a refresh if forms were actually fixed
      if (fixedCount > 0) {
        setForceRender(prev => prev + 1);
      }
      
    } catch (e) {
      console.error(`[${instanceId.current}] Error in fixExistingForms:`, e);
    }
  };

  const handleReload = async () => {
    try {
      toast.info('جاري إعادة تهيئة الاتصال...');
      await reload();
      setSyncError(null);
      
      // Force reload all forms
      setForceRender(prev => prev + 1);
      
      toast.success('تم إعادة تهيئة الاتصال بنجاح');
    } catch (error) {
      console.error(`[${instanceId.current}] Error reloading connection:`, error);
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
      console.error(`[${instanceId.current}] Error during emergency reset:`, error);
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
      console.error(`[${instanceId.current}] Error during full reset:`, error);
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

  // Show loading while we sync - only very briefly
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
      key={`forms-${instanceId.current}`} 
      forceRefresh={forceRender > 0}
      onReset={handleFullReset}
    />
  );
};

export default Forms;
