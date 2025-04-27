
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  price: string;
  compareAtPrice: string | null;
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
  orderNumber: string;
  totalPrice: string;
  createdAt: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
  };
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
  };
}
