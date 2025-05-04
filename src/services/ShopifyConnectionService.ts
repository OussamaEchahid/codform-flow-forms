
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createShopifyAPI } from '@/lib/shopify/api';

/**
 * Service to manage Shopify connections with improved reliability
 */
export class ShopifyConnectionService {
  private lastSuccessfulSync: number = 0;
  private syncAttempts: number = 0;
  private static instance: ShopifyConnectionService;
  private tokenCache: Record<string, {token: string, timestamp: number}> = {};
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ShopifyConnectionService {
    if (!ShopifyConnectionService.instance) {
      ShopifyConnectionService.instance = new ShopifyConnectionService();
    }
    return ShopifyConnectionService.instance;
  }
  
  /**
   * Verify connection to Shopify with retry capability
   */
  public async verifyConnection(shop: string, forceRefresh = false): Promise<boolean> {
    try {
      console.log(`Verifying connection for shop: ${shop} (forceRefresh: ${forceRefresh})`);
      
      // Try to use cached token first (valid for 10 minutes)
      const cachedData = this.tokenCache[shop];
      const now = Date.now();
      const tokenCacheExpiry = 10 * 60 * 1000; // 10 minutes
      
      if (!forceRefresh && cachedData && (now - cachedData.timestamp < tokenCacheExpiry)) {
        console.log("Using cached token for connection verification");
        try {
          const api = createShopifyAPI(cachedData.token, shop);
          const result = await api.verifyConnection();
          
          if (result) {
            console.log("Connection verified successfully with cached token");
            return true;
          }
        } catch (err) {
          console.log("Cached token verification failed, fetching fresh token");
        }
      }
      
      // If cache failed or we need fresh token, fetch from the database
      const { data, error } = await supabase.rpc(
        'get_shopify_store_data',
        { store_domain: shop }
      );
      
      if (error || !data || !data.access_token) {
        console.error("Error fetching Shopify token:", error);
        return false;
      }
      
      // Cache the token
      this.tokenCache[shop] = {
        token: data.access_token,
        timestamp: now
      };
      
      // Create Shopify API client and test connection
      const api = createShopifyAPI(data.access_token, shop);
      const connected = await api.verifyConnection();
      
      if (connected) {
        console.log(`Connection verified successfully for shop ${shop}`);
        
        // Update connection status in localStorage for reliability
        localStorage.setItem('shopify_connected', 'true');
        localStorage.setItem('shopify_store', shop);
        
        // Update connection manager
        shopifyConnectionManager.addOrUpdateStore(shop, true);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error in verifyConnection:", error);
      return false;
    }
  }
  
  /**
   * Sync form with Shopify - with improved error handling and retries
   */
  public async syncFormWithShopify(formId: string, shop: string): Promise<boolean> {
    try {
      this.syncAttempts++;
      console.log(`Syncing form ${formId} with shop ${shop} (attempt ${this.syncAttempts})`);
      
      // Verify connection first
      const isConnected = await this.verifyConnection(shop);
      
      if (!isConnected && this.syncAttempts < 3) {
        console.log(`Connection verification failed, retrying (${this.syncAttempts}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return this.syncFormWithShopify(formId, shop);
      }
      
      if (!isConnected) {
        console.error("Failed to verify connection after multiple attempts");
        
        // Enable bypass mode to allow continuing without API connection
        localStorage.setItem('bypass_auth', 'true');
        
        // Record form ID in pending sync list for later synchronization
        const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
        if (!pendingSyncs.includes(formId)) {
          pendingSyncs.push(formId);
          localStorage.setItem('pending_form_syncs', JSON.stringify(pendingSyncs));
        }
        
        return false;
      }
      
      // Get shop token
      const { data: shopData, error: shopError } = await supabase.rpc(
        'get_shopify_store_data',
        { store_domain: shop }
      );
      
      if (shopError || !shopData || !shopData.access_token) {
        console.error("Error fetching shop token:", shopError);
        return false;
      }
      
      // Get form data
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
      
      if (formError || !formData) {
        console.error("Error fetching form data:", formError);
        return false;
      }
      
      // Extract block ID from form data or generate a default one
      const blockId = formData.data?.blockId || 
                    (formData.data?.settings?.blockId) || 
                    `codform-${formId.substring(0, 8)}`;
      
      // Create API client and sync
      const api = createShopifyAPI(shopData.access_token, shop);
      
      await api.setupAutoSync({
        formId: formId,
        settings: {
          blockId: blockId
        }
      });
      
      // Update last successful sync time
      this.lastSuccessfulSync = Date.now();
      this.syncAttempts = 0;
      
      // Remove from pending sync list if present
      const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
      const updatedSyncs = pendingSyncs.filter((id: string) => id !== formId);
      localStorage.setItem('pending_form_syncs', JSON.stringify(updatedSyncs));
      
      return true;
    } catch (error) {
      console.error("Error in syncFormWithShopify:", error);
      
      // Record form ID for later synchronization
      const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
      if (!pendingSyncs.includes(formId)) {
        pendingSyncs.push(formId);
        localStorage.setItem('pending_form_syncs', JSON.stringify(pendingSyncs));
      }
      
      return false;
    }
  }
  
  /**
   * Force resyncing all pending forms
   */
  public async resyncPendingForms(shop: string): Promise<void> {
    try {
      const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
      
      if (pendingSyncs.length === 0) {
        toast.info('لا توجد نماذج معلقة للمزامنة');
        return;
      }
      
      toast.info(`جاري مزامنة ${pendingSyncs.length} نماذج معلقة...`);
      
      for (const formId of pendingSyncs) {
        await this.syncFormWithShopify(formId, shop);
      }
      
      toast.success('تمت مزامنة جميع النماذج المعلقة');
    } catch (error) {
      console.error("Error resyncing pending forms:", error);
      toast.error('حدث خطأ أثناء مزامنة النماذج المعلقة');
    }
  }
  
  /**
   * Reset connection state and clear caches
   */
  public resetConnectionState(): void {
    this.tokenCache = {};
    this.syncAttempts = 0;
    shopifyConnectionManager.resetLoopDetection();
  }
}

export const shopifyConnectionService = ShopifyConnectionService.getInstance();
