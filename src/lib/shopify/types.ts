
/**
 * أنواع بيانات Shopify المبسطة
 */

// نوع بيانات منتج Shopify
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description?: string;
  price?: string;
  image?: string;
}

// نوع بيانات النموذج المرتبط بمتجر Shopify
export interface ShopifyFormData {
  form_id: string;
  product_id?: string;
  shop_id?: string;
  settings?: {
    enabled: boolean;
    position?: string;
    style?: string;
    blockId?: string;
    products?: string[];
  };
}

// نوع بيانات طلب إعدادات المنتج
export interface ProductSettingsRequest {
  productId: string;
  formId: string;
  blockId?: string;
  enabled?: boolean;
  shopId?: string;
}

// نوع بيانات استجابة إعدادات المنتج
export interface ProductSettingsResponse {
  success?: boolean;
  error?: string;
  productId?: string;
  formId?: string;
  blockId?: string;
}

// نوع بيانات استجابة التحقق من اتصال Shopify
export interface ShopifyVerifyResponse {
  success: boolean;
  shop?: string;
  timestamp?: string;
}

// نوع بيانات طلب Shopify
export interface ShopifyOrder {
  id: string;
  order_number: string;
  email: string;
  created_at: string;
  total_price: string;
  currency: string;
  financial_status: string;
}
