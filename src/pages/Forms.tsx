
import React, { useEffect, useState } from 'react';
import FormsPage from './FormsPage';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { logShopifyDiagnostics, logFormDiagnostics } from '@/utils/diagnostics';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const Forms = () => {
  const { shopDomain, isConnected, isLoading, syncState, reload } = useShopifyConnection();
  const [hasSynced, setHasSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Run diagnostics on component mount
  useEffect(() => {
    logShopifyDiagnostics();
    logFormDiagnostics(supabase, shopDomain);
  }, [shopDomain]);
  
  // Force a sync before rendering forms
  useEffect(() => {
    const performSync = async () => {
      if (!hasSynced && !isLoading) {
        console.log('Forms page: Forcing connection sync to ensure fresh data');
        try {
          await syncState();
          setHasSynced(true);
        } catch (error) {
          console.error('Error syncing connection state:', error);
          setSyncError('فشل في مزامنة حالة الاتصال، يرجى إعادة تحميل الصفحة');
        }
      }
    };
    
    performSync();
  }, [syncState, isLoading, hasSynced]);

  useEffect(() => {
    // Log the connection status for debugging
    console.log('Forms page loaded. Shopify connection status:', { 
      isConnected, 
      shopDomain,
      isLoading
    });
    
    // Store current shop ID in localStorage as a fallback
    if (shopDomain) {
      localStorage.setItem('shopify_store', shopDomain);
      console.log('Stored shopDomain in localStorage:', shopDomain);
    }
  }, [isConnected, shopDomain, isLoading]);

  const handleReload = async () => {
    try {
      await reload();
      setSyncError(null);
      window.location.reload();
    } catch (error) {
      console.error('Error reloading connection:', error);
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
            <Button onClick={handleReload} variant="outline">
              إعادة تحميل الصفحة
            </Button>
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

  return (
    <FormsPage shopId={shopDomain} />
  );
};

export default Forms;
