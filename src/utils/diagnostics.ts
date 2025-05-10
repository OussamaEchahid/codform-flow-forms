
/**
 * Diagnostic utilities for debugging application state
 */

/**
 * Logs comprehensive diagnostic information about Shopify connection state
 */
export const logShopifyDiagnostics = () => {
  try {
    const diagnostics = {
      localStorage: {
        shopify_store: localStorage.getItem('shopify_store'),
        shopify_connected: localStorage.getItem('shopify_connected'),
        shopify_last_url_shop: localStorage.getItem('shopify_last_url_shop'),
        shopify_sync_attempts: localStorage.getItem('shopify_sync_attempts'),
        shopify_recovery_mode: localStorage.getItem('shopify_recovery_mode'),
        shopify_token: localStorage.getItem('shopify_token') ? '[PRESENT]' : '[NOT PRESENT]',
        shopify_failsafe: localStorage.getItem('shopify_failsafe'),
      },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      environment: {
        isDev: process.env.NODE_ENV === 'development' || import.meta.env.DEV === true,
        mode: process.env.NODE_ENV || import.meta.env.MODE,
      }
    };
    
    console.log('===== SHOPIFY CONNECTION DIAGNOSTICS =====');
    console.log(JSON.stringify(diagnostics, null, 2));
    console.log('=========================================');
    
    return diagnostics;
  } catch (error) {
    console.error('Error generating diagnostics:', error);
    return { error: 'Failed to generate diagnostics' };
  }
};

/**
 * Logs form loading diagnostics
 */
export const logFormDiagnostics = async (supabase: any, shopId?: string) => {
  try {
    // Get the shop ID from various sources
    const shopIdFromProps = shopId;
    const shopIdFromLocalStorage = localStorage.getItem('shopify_store');
    
    console.log('===== FORM LOADING DIAGNOSTICS =====');
    console.log('Shop IDs:', {
      fromProps: shopIdFromProps,
      fromLocalStorage: shopIdFromLocalStorage,
      used: shopIdFromProps || shopIdFromLocalStorage
    });
    
    // Get form counts from database for debugging
    if (supabase) {
      console.log('Querying database for form counts...');
      
      try {
        // Count total forms
        const { count: totalCount, error: totalError } = await supabase
          .from('forms')
          .select('*', { count: 'exact', head: true });
          
        if (totalError) {
          console.error('Error counting all forms:', totalError);
        } else {
          console.log(`Total forms in database: ${totalCount}`);
        }
        
        // Query for specific shop if we have an ID
        if (shopIdFromProps || shopIdFromLocalStorage) {
          const shopToQuery = shopIdFromProps || shopIdFromLocalStorage;
          
          const { count: shopCount, error: shopError } = await supabase
            .from('forms')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopToQuery);
            
          if (shopError) {
            console.error(`Error counting forms for shop ${shopToQuery}:`, shopError);
          } else {
            console.log(`Forms for shop ${shopToQuery}: ${shopCount}`);
          }
          
          // If no forms found, try a broader query
          if (shopCount === 0) {
            console.log('No forms found for shop, checking for any forms without strict match...');
            
            // Query for forms with similar shop_id pattern
            const { data: possibleForms, error: possibleError } = await supabase
              .from('forms')
              .select('id, title, shop_id')
              .limit(5);
              
            if (possibleError) {
              console.error('Error in broader query:', possibleError);
            } else {
              console.log('Sample of forms in database:', possibleForms);
            }
          }
        }
      } catch (dbError) {
        console.error('Error in database diagnostics:', dbError);
      }
    }
    
    console.log('===================================');
  } catch (error) {
    console.error('Error in form diagnostics:', error);
  }
};

/**
 * Reset all Shopify connection state
 */
export const resetShopifyConnection = () => {
  try {
    console.log('Performing emergency reset of Shopify connection state');
    
    // Clear all Shopify-related localStorage items
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_token');
    localStorage.removeItem('shopify_failsafe');
    localStorage.removeItem('shopify_sync_attempts');
    localStorage.removeItem('shopify_recovery_mode');
    localStorage.removeItem('shopify_last_url_shop');
    localStorage.removeItem('shopify_temp_store');
    
    console.log('Shopify connection state reset complete');
    
    return true;
  } catch (error) {
    console.error('Error resetting Shopify connection state:', error);
    return false;
  }
};
