
/**
 * Centralized utility for managing shop ID retrieval
 * This ensures consistent shop_id handling across the entire application
 */

export interface ShopInfo {
  shopId: string | null;
  source: 'simple_active_store' | 'shopify_store' | 'active_shop' | 'none';
}

/**
 * Get the active shop ID with consistent priority order
 * Priority: simple_active_store > shopify_store > active_shop
 */
export function getActiveShopId(): string | null {
  const shopInfo = getActiveShopInfo();
  return shopInfo.shopId;
}

/**
 * Get detailed shop information including the source
 */
export function getActiveShopInfo(): ShopInfo {
  // Priority order for shop ID retrieval
  const sources: Array<{ key: string; source: ShopInfo['source'] }> = [
    { key: 'simple_active_store', source: 'simple_active_store' },
    { key: 'shopify_store', source: 'shopify_store' },
    { key: 'active_shop', source: 'active_shop' }
  ];

  for (const { key, source } of sources) {
    const shopId = localStorage.getItem(key);
    if (shopId && shopId.trim()) {
      console.log(`🏪 Active shop retrieved from ${source}: ${shopId}`);
      return { shopId: shopId.trim(), source };
    }
  }

  console.warn('⚠️ No active shop found in localStorage');
  return { shopId: null, source: 'none' };
}

/**
 * Validate if a shop ID appears to be valid
 */
export function isValidShopId(shopId: string | null): boolean {
  if (!shopId) return false;
  
  // Basic validation - should end with .myshopify.com or be a valid domain
  return shopId.includes('.') && shopId.length > 3;
}

/**
 * Clean and normalize shop domain
 */
export function cleanShopDomain(shop: string): string {
  if (!shop) return "";
  
  let cleanedShop = shop.trim();
  
  // Remove protocol if present
  if (cleanedShop.startsWith('http')) {
    try {
      const url = new URL(cleanedShop);
      cleanedShop = url.hostname;
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // Ensure it ends with myshopify.com
  if (!cleanedShop.endsWith('myshopify.com')) {
    if (!cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
    }
  }
  
  return cleanedShop;
}

/**
 * Set the active shop with proper cleanup
 */
export function setActiveShop(shopDomain: string): void {
  const cleanedDomain = cleanShopDomain(shopDomain);
  
  if (!isValidShopId(cleanedDomain)) {
    console.error('Invalid shop domain provided:', shopDomain);
    return;
  }

  console.log(`🔄 Setting active shop: ${cleanedDomain}`);
  
  // Clear old values first
  localStorage.removeItem('simple_active_store');
  localStorage.removeItem('shopify_store');
  localStorage.removeItem('active_shop');
  
  // Set the new active shop
  localStorage.setItem('simple_active_store', cleanedDomain);
  localStorage.setItem('shopify_store', cleanedDomain); // For backward compatibility
  localStorage.setItem('shopify_connected', 'true');
  
  console.log(`✅ Active shop set: ${cleanedDomain}`);
}
