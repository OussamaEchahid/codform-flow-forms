
import { supabase } from '@/integrations/supabase/client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { toast } from 'sonner';

/**
 * Enhanced service for managing Shopify connections with improved reliability
 */
class ShopifyConnectionService {
  /**
   * Verifies connection with a Shopify store
   */
  public async verifyConnection(shopDomain: string, forceRefresh: boolean = false): Promise<boolean> {
    try {
      console.log(`Verifying connection with shop: ${shopDomain}`);
      
      if (!shopDomain) {
        throw new Error("No shop domain provided");
      }

      // Get store data including access token
      const { data: storeData, error: storeError } = await supabase.rpc(
        'get_shopify_store_data',
        { store_domain: shopDomain }
      );
      
      if (storeError || !storeData || !storeData.access_token) {
        console.error("Error fetching store data:", storeError || "No store data returned");
        return false;
      }
      
      // Verify token works by making simple API call through proxy
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const url = `/api/shopify-proxy?t=${timestamp}&rid=${uniqueId}&ver=1`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ 
          query: `{ shop { name } }`,
          shop: shopDomain,
          accessToken: storeData.access_token,
          timestamp,
          requestId: uniqueId
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        console.error(`API Error Response:`, response.status, response.statusText);
        return false;
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        return false;
      }
      
      if (!result.data || !result.data.shop || !result.data.shop.name) {
        console.error("Invalid response format:", result);
        return false;
      }
      
      console.log("Connection verified successfully with shop:", result.data.shop.name);
      return true;
      
    } catch (error) {
      console.error("Error verifying connection:", error);
      return false;
    }
  }
  
  /**
   * Force activates a specific store and deactivates all others
   */
  public async forceActivateStore(shopDomain: string): Promise<boolean> {
    try {
      if (!shopDomain) {
        console.error("No shop domain provided to forceActivateStore");
        return false;
      }
      
      console.log(`Force activating store: ${shopDomain}`);
      
      // Step 1: First update the target store to be active
      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('shop', shopDomain);
      
      if (updateError) {
        console.error("Error updating store as active:", updateError);
        // Continue anyway as the next step is more important
      }
      
      // Step 2: Deactivate all other stores using a condition that doesn't use UUID
      // This fixes the "invalid input syntax for type uuid" error by avoiding the problematic comparison
      const { error: deactivateError } = await supabase
        .from('shopify_stores')
        .update({ is_active: false })
        .neq('shop', shopDomain); // Use 'shop' column which is text, not UUID
      
      if (deactivateError) {
        console.error("Error deactivating other stores:", deactivateError);
        return false;
      }
      
      // Step 3: Also run the ensure_single_active_store function as a fallback
      const { error: ensureError } = await supabase.rpc('ensure_single_active_store');
      if (ensureError) {
        console.error("Error ensuring single active store:", ensureError);
        // Non-critical error, can continue
      }
      
      // Update localStorage and connection manager
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      shopifyConnectionManager.addOrUpdateStore(shopDomain, true);
      
      return true;
    } catch (error) {
      console.error("Error in forceActivateStore:", error);
      return false;
    }
  }
  
  /**
   * Syncs a form with Shopify
   */
  public async syncFormWithShopify(formId: string, shopDomain: string): Promise<boolean> {
    try {
      if (!formId || !shopDomain) {
        console.error("Missing required parameters formId or shopDomain");
        return false;
      }
      
      console.log(`Syncing form ${formId} with shop ${shopDomain}`);
      
      // Get the form data
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
      
      if (formError || !formData) {
        console.error("Error fetching form data:", formError);
        return false;
      }
      
      // Get store data including access token
      const { data: storeData, error: storeError } = await supabase.rpc(
        'get_shopify_store_data',
        { store_domain: shopDomain }
      );
      
      if (storeError || !storeData || !storeData.access_token) {
        console.error("Error fetching store data:", storeError || "No store data returned");
        
        // Try fallback direct query
        const { data: directData, error: directError } = await supabase
          .from('shopify_stores')
          .select('access_token')
          .eq('shop', shopDomain)
          .single();
        
        if (directError || !directData || !directData.access_token) {
          console.error("Direct query failed:", directError);
          return false;
        }
        
        // Use direct query result
        storeData.access_token = directData.access_token;
      }
      
      // Create API request to sync with Shopify
      const shopifyFormData = {
        formId: formId,
        settings: formData.data || {},
        shopDomain: shopDomain
      };
      
      // Call Shopify API through edge function or proxy
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const url = `/api/shopify-proxy?t=${timestamp}&rid=${uniqueId}&action=sync`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ 
          formData: shopifyFormData,
          shop: shopDomain,
          accessToken: storeData.access_token,
          timestamp,
          requestId: uniqueId
        }),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error("Error syncing form with Shopify:", response.status, response.statusText);
        return false;
      }
      
      const result = await response.json();
      
      if (result.error) {
        console.error("API error syncing form:", result.error);
        return false;
      }
      
      console.log("Form synced successfully with Shopify");
      return true;
    } catch (error) {
      console.error("Error in syncFormWithShopify:", error);
      return false;
    }
  }
  
  /**
   * Re-syncs all pending forms
   */
  public async resyncPendingForms(shopDomain: string): Promise<boolean> {
    try {
      if (!shopDomain) {
        toast.error('لا يوجد متجر Shopify محدد لإعادة المزامنة');
        return false;
      }
      
      const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
      
      if (pendingSyncs.length === 0) {
        toast.info('لا توجد نماذج معلقة للمزامنة');
        return true;
      }
      
      toast.info(`جاري مزامنة ${pendingSyncs.length} نموذج معلق...`);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const formId of pendingSyncs) {
        const success = await this.syncFormWithShopify(formId, shopDomain);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      // Update pending syncs list
      if (successCount > 0) {
        // Remove successfully synced forms
        const remainingForms = pendingSyncs.filter((_: string, index: number) => index >= successCount);
        localStorage.setItem('pending_form_syncs', JSON.stringify(remainingForms));
      }
      
      // Show final result
      if (failCount === 0) {
        toast.success(`تم مزامنة جميع النماذج المعلقة (${successCount} نموذج)`);
        return true;
      } else if (successCount > 0) {
        toast.info(`تم مزامنة ${successCount} نموذج، وفشلت مزامنة ${failCount} نموذج`);
        return true;
      } else {
        toast.error(`فشلت مزامنة جميع النماذج المعلقة (${failCount} نموذج)`);
        return false;
      }
    } catch (error) {
      console.error("Error in resyncPendingForms:", error);
      toast.error('حدث خطأ أثناء إعادة مزامنة النماذج المعلقة');
      return false;
    }
  }
  
  /**
   * Resets connection state
   */
  public resetConnectionState(): void {
    try {
      shopifyConnectionManager.resetLoopDetection();
    } catch (error) {
      console.error("Error resetting connection state:", error);
    }
  }
  
  /**
   * Completely resets all connection data (including localStorage and connection manager)
   */
  public completeConnectionReset(): void {
    try {
      // Clear any stored connection data
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_last_url_shop');
      localStorage.removeItem('shopify_last_error');
      localStorage.removeItem('shopify_recovery_attempt');
      localStorage.removeItem('shopify_connection_timestamp');
      localStorage.removeItem('shopify_failsafe');
      localStorage.removeItem('bypass_auth');
      
      // Reset the connection manager
      shopifyConnectionManager.clearAllStores();
      shopifyConnectionManager.resetLoopDetection();
      
      toast.success('تم إعادة تعيين جميع بيانات الاتصال بنجاح');
    } catch (error) {
      console.error("Error in completeConnectionReset:", error);
      toast.error('حدث خطأ أثناء إعادة تعيين بيانات الاتصال');
    }
  }
}

// Singleton instance
export const shopifyConnectionService = new ShopifyConnectionService();
