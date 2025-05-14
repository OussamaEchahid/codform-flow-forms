
// Only adding the necessary part to add tags to the ShopifyProduct interface
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  price: string;
  images: string[];
  tags?: string[] | string;
  variants: Array<{
    id: string;
    title: string;
    price?: string;
    available?: boolean;
  }>;
}
