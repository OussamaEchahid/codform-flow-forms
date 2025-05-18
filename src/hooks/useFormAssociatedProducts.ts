
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { shopifySupabase } from '@/lib/shopify/supabase-client';

export const useFormAssociatedProducts = (formId: string | undefined) => {
  const { shop } = useAuth();
  const [associatedProducts, setAssociatedProducts] = useState<Array<{id: string, title: string}>>([]);

  // Fetch associated products for current form - with cleanup to prevent memory leaks
  useEffect(() => {
    let isMounted = true;
    
    async function fetchAssociatedProducts() {
      if (!formId || formId === 'new' || !shop) return;
      
      try {
        // Get product settings for this form
        const { data: productSettings, error } = await shopifySupabase
          .from('shopify_product_settings')
          .select('*')
          .eq('form_id', formId);
          
        if (error) {
          console.error('Error fetching product settings:', error);
          return;
        }
        
        // If no associated products, exit early
        if (!productSettings || productSettings.length === 0) {
          if (isMounted) {
            setAssociatedProducts([]);
          }
          return;
        }
        
        const productIds = productSettings.map(s => s.product_id);
        
        // Fetch product details from cached products table
        const { data: cachedProducts } = await shopifySupabase
          .from('shopify_cached_products')
          .select('products')
          .eq('shop', shop)
          .single();
          
        if (cachedProducts?.products && isMounted) {
          const shopifyProducts = cachedProducts.products;
          const matchedProducts = shopifyProducts
            .filter((product: any) => productIds.includes(product.id))
            .map((product: any) => ({ 
              id: product.id, 
              title: product.title 
            }));
            
          setAssociatedProducts(matchedProducts);
        }
      } catch (error) {
        console.error('Error fetching associated products:', error);
      }
    }
    
    fetchAssociatedProducts();
    
    return () => {
      isMounted = false;
    };
  }, [formId, shop]);
  
  return { associatedProducts };
};
