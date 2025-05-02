
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
  settings?: {
    enabled: boolean;
    placement?: string;
    style?: string;
  };
}

// نوع بيانات استجابة التحقق من اتصال Shopify
export interface ShopifyVerifyResponse {
  success: boolean;
  shop?: string;
  timestamp?: string;
}
