
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
  
  console.log(`[${instanceId.current}] Forms component rendering. Shop domain:`, shopDomain, "isConnected:", isConnected);
  
  // Force a sync ONCE on component load
  useEffect(() => {
    const performSync = async () => {
      if (!hasSynced) {
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
          toast.error('فشل في مزامنة حالة الاتصال، يرجى إعادة تحميل الصفحة');
        } finally {
          // Always set loading to false after sync attempt
          setIsLoading(false);
        }
      }
    };
    
    performSync();
  }, [syncState, hasSynced, shopDomain]);

  // Show loading while we sync - only briefly
  if (isLoading) {
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
    />
  );
};

export default Forms;
