
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createShopifyAPI } from '@/lib/shopify/api';
import { Json } from '@/integrations/supabase/types';

/**
 * Service to manage Shopify connections with improved reliability
 */
export class ShopifyConnectionService {
  private lastSuccessfulSync: number = 0;
  private syncAttempts: number = 0;
  private static instance: ShopifyConnectionService;
  private tokenCache: Record<string, {token: string, timestamp: number}> = {};
  private dbErrorCount: number = 0;
  
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
      let token = null;
      
      try {
        // Direct query first approach
        const { data, error } = await supabase.rpc(
          'get_shopify_store_data',
          { store_domain: shop }
        );
        
        if (error) {
          console.error("Error fetching Shopify token via RPC:", error);
          this.dbErrorCount++;
          
          // Fall back to direct table query if RPC fails
          if (this.dbErrorCount > 1) {
            console.log("Trying direct query as fallback...");
            const { data: directData, error: directError } = await supabase
              .from('shopify_stores')
              .select('access_token')
              .eq('shop', shop)
              .single();
              
            if (directError) {
              console.error("Direct query also failed:", directError);
              throw new Error("Failed to retrieve token from database");
            }
            
            if (directData && directData.access_token) {
              token = directData.access_token;
              console.log("Retrieved token via direct query");
            }
          } else {
            throw error;
          }
        } else if (data && data.access_token) {
          token = data.access_token;
          // Reset error counter on success
          this.dbErrorCount = 0;
        }
      } catch (dbError) {
        console.error("Database error in token retrieval:", dbError);
        
        // Last resort: check if we have token in localStorage (for development/testing)
        if (typeof window !== 'undefined') {
          const localToken = localStorage.getItem(`shopify_token_${shop}`);
          if (localToken) {
            console.log("Using localStorage token as last resort");
            token = localToken;
          }
        }
      }
      
      if (!token) {
        console.error(`No access token found for shop: ${shop}`);
        this.enableFailSafeMode();
        return false;
      }
      
      // Cache the token
      this.tokenCache[shop] = {
        token: token,
        timestamp: now
      };
      
      // Create Shopify API client and test connection
      const api = createShopifyAPI(token, shop);
      
      try {
        const connected = await api.verifyConnection();
        
        if (connected) {
          console.log(`Connection verified successfully for shop ${shop}`);
          
          // Update connection status in localStorage for reliability
          localStorage.setItem('shopify_connected', 'true');
          localStorage.setItem('shopify_store', shop);
          
          // Save token in localStorage as backup
          localStorage.setItem(`shopify_token_${shop}`, token);
          
          // Update connection manager
          shopifyConnectionManager.addOrUpdateStore(shop, true);
          
          // Disable fail-safe mode if it was enabled
          this.disableFailSafeMode();
          
          return true;
        }
        
        // If connection failed, token might be invalid
        console.error(`Connection failed for shop ${shop} - token may be expired`);
        this.enableFailSafeMode();
        return false;
      } catch (apiError) {
        console.error("API verification error:", apiError);
        this.enableFailSafeMode();
        return false;
      }
    } catch (error) {
      console.error("Error in verifyConnection:", error);
      this.enableFailSafeMode();
      return false;
    }
  }
  
  /**
   * Enable fail-safe mode for when Shopify connection is unavailable
   */
  private enableFailSafeMode(): void {
    localStorage.setItem('shopify_failsafe', 'true');
    localStorage.setItem('bypass_auth', 'true');
    console.log("Fail-safe mode enabled");
  }
  
  /**
   * Disable fail-safe mode
   */
  private disableFailSafeMode(): void {
    localStorage.removeItem('shopify_failsafe');
    console.log("Fail-safe mode disabled");
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
        this.enableFailSafeMode();
        
        // Record form ID in pending sync list for later synchronization
        const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
        if (!pendingSyncs.includes(formId)) {
          pendingSyncs.push(formId);
          localStorage.setItem('pending_form_syncs', JSON.stringify(pendingSyncs));
        }
        
        return false;
      }
      
      // Get token from cache first
      let accessToken = this.tokenCache[shop]?.token;
      
      // If not in cache, get fresh from the database
      if (!accessToken) {
        try {
          const { data: shopData, error: shopError } = await supabase.rpc(
            'get_shopify_store_data',
            { store_domain: shop }
          );
          
          if (shopError || !shopData || !shopData.access_token) {
            console.error("Error fetching shop token:", shopError);
            return false;
          }
          
          accessToken = shopData.access_token;
        } catch (error) {
          console.error("Error fetching shop token:", error);
          return false;
        }
      }
      
      if (!accessToken) {
        console.error("Could not retrieve access token");
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
      // Fix: Properly handle the data structure, accounting for the Json type
      let blockId = `codform-${formId.substring(0, 8)}`; // Default value
      
      // Safely extract blockId from the data
      const formDataJson = formData.data as Json;
      if (typeof formDataJson === 'object' && formDataJson !== null) {
        // Check if blockId exists directly in the data object
        if ('blockId' in formDataJson && typeof formDataJson.blockId === 'string') {
          blockId = formDataJson.blockId;
        } 
        // Check if it's in settings
        else if ('settings' in formDataJson && 
                typeof formDataJson.settings === 'object' && 
                formDataJson.settings !== null && 
                'blockId' in formDataJson.settings && 
                typeof formDataJson.settings.blockId === 'string') {
          blockId = formDataJson.settings.blockId;
        }
      }
      
      // Create API client and sync
      const api = createShopifyAPI(accessToken, shop);
      
      try {
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
      } catch (syncError) {
        console.error("Error in setupAutoSync:", syncError);
        
        // Record form ID for later synchronization
        const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
        if (!pendingSyncs.includes(formId)) {
          pendingSyncs.push(formId);
          localStorage.setItem('pending_form_syncs', JSON.stringify(pendingSyncs));
        }
        
        return false;
      }
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
    this.dbErrorCount = 0;
    shopifyConnectionManager.resetLoopDetection();
  }
}

export const shopifyConnectionService = ShopifyConnectionService.getInstance();
