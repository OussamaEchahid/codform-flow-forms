
import { shopifySupabase } from './supabase-client';

/**
 * Validate a Shopify shop domain
 */
export function normalizeShopDomain(domain: string | null): string | null {
  if (!domain) return null;
  
  let normalizedDomain = domain.trim().toLowerCase();
  
  // Remove protocol if present
  if (normalizedDomain.startsWith('http://') || normalizedDomain.startsWith('https://')) {
    try {
      const url = new URL(normalizedDomain);
      normalizedDomain = url.hostname;
    } catch (error) {
      console.error('Invalid URL format', error);
    }
  }
  
  // Add myshopify.com if missing
  if (!normalizedDomain.includes('.myshopify.com')) {
    normalizedDomain = `${normalizedDomain}.myshopify.com`;
  }
  
  return normalizedDomain;
}

/**
 * Test if a Shopify token is valid
 */
export async function testShopifyToken(shop: string, token: string): Promise<boolean> {
  if (!shop || !token) return false;
  
  try {
    // Ensure shop has proper domain format
    const shopDomain = normalizeShopDomain(shop);
    if (!shopDomain) return false;
    
    // Make a simple API request to test the token
    const response = await fetch(`https://${shopDomain}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error testing Shopify token:', error);
    return false;
  }
}

/**
 * Get the current active Shopify store from the database
 */
export async function getActiveStore(): Promise<{ shop: string; token: string } | null> {
  try {
    const { data, error } = await shopifySupabase
      .from('shopify_stores')
      .select('shop, access_token')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1);
      
    if (error || !data || data.length === 0) {
      return null;
    }
    
    return {
      shop: data[0].shop,
      token: data[0].access_token || ''
    };
  } catch (error) {
    console.error('Error getting active Shopify store:', error);
    return null;
  }
}

/**
 * Save a Shopify token to the database
 */
export async function saveShopifyToken(shop: string, token: string): Promise<boolean> {
  if (!shop || !token) return false;
  
  try {
    // Normalize shop domain
    const normalizedShop = normalizeShopDomain(shop);
    if (!normalizedShop) return false;
    
    // Check if store already exists
    const { data, error } = await shopifySupabase
      .from('shopify_stores')
      .select('id')
      .eq('shop', normalizedShop)
      .limit(1);
      
    if (error) {
      console.error('Error checking for existing shop:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      // Update existing store
      const { error: updateError } = await shopifySupabase
        .from('shopify_stores')
        .update({ 
          access_token: token,
          is_active: true,
          updated_at: new Date().toISOString() 
        })
        .eq('shop', normalizedShop);
        
      if (updateError) {
        console.error('Error updating shop token:', updateError);
        return false;
      }
    } else {
      // Create new store
      const { error: insertError } = await shopifySupabase
        .from('shopify_stores')
        .insert({
          shop: normalizedShop,
          access_token: token,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating shop record:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving Shopify token:', error);
    return false;
  }
}
