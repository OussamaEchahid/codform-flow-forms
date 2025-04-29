
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  price: string;
  images: string[];
  variants: ShopifyVariant[];
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  available: boolean;
}

export interface ShopifyOrder {
  id: string;
  name: string;
  total_price: string;
  created_at: string;
  items: ShopifyLineItem[];
  customer?: ShopifyCustomer;
}

export interface ShopifyLineItem {
  id: string;
  product_id: string;
  variant_id: string;
  title: string;
  quantity: number;
  price: string;
  total: string;
}

export interface ShopifyCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export interface ShopifyFormData {
  formId: string;
  shopDomain: string;
  settings: {
    position: 'product-page' | 'cart-page' | 'checkout';
    style: {
      primaryColor: string;
      fontSize: string;
      borderRadius: string;
    };
    products?: string[];
  };
}
