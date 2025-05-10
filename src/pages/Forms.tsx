
import React, { useEffect, useState, useRef } from 'react';
import FormsPage from './FormsPage';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Forms = () => {
  const { shopDomain, isConnected, syncState } = useShopifyConnection();
  const [hasSynced, setHasSynced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const instanceId = useRef(`forms-${Math.random().toString(36).substr(2, 8)}`);
  
  // Force a sync ONCE on component load and then render immediately
  useEffect(() => {
    const performSync = async () => {
      if (!hasSynced) {
        setIsLoading(true);
        console.log(`[${instanceId.current}] Forms page: Forcing connection sync once`);
        
        try {
          // Store current shop ID in localStorage immediately when available
          if (shopDomain) {
            localStorage.setItem('shopify_store', shopDomain);
            console.log(`[${instanceId.current}] Stored shopDomain in localStorage:`, shopDomain);
          }
          
          // Start sync in background, but don't await it
          const syncPromise = syncState();
          
          // Don't wait for sync to complete before showing forms
          // This prevents page freezing while syncing
          setTimeout(() => {
            setIsLoading(false);
            setHasSynced(true);
          }, 500);
          
          // Handle sync completion in background
          syncPromise
            .then(() => console.log(`[${instanceId.current}] Sync completed successfully`))
            .catch(error => {
              console.error(`[${instanceId.current}] Error syncing connection state:`, error);
              // Don't show error toast as we're already showing forms
            });
        } catch (error) {
          console.error(`[${instanceId.current}] Error in sync process:`, error);
          // Even if sync fails, still show forms
          setIsLoading(false);
          setHasSynced(true);
        }
      }
    };
    
    performSync();
  }, [syncState, hasSynced, shopDomain]);

  // Show brief loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary ml-2" />
        <span>جاري التحميل...</span>
      </div>
    );
  }

  // Pass key with instanceId to ensure proper re-rendering when needed
  return (
    <FormsPage 
      shopId={shopDomain} 
      key={`forms-${instanceId.current}`}
      forceRefresh={true} // Always load fresh data
    />
  );
};

export default Forms;
