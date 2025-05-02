
// API endpoint for product settings
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

// Define the request and response types locally since we're having issues with imports
interface ProductSettingsRequest {
  productId: string;
  formId: string;
  blockId?: string;
  enabled?: boolean;
  shopId?: string; // Add shopId as optional param
}

interface ProductSettingsResponse {
  success?: boolean;
  error?: string;
  productId?: string;
  formId?: string;
  blockId?: string;
}

export default async function handler(
  req: any,
  res: any
) {
  if (req.method === 'POST') {
    try {
      const { productId, formId, blockId, enabled = true, shopId }: ProductSettingsRequest = req.body;
      
      if (!productId || !formId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Product ID and Form ID are required' 
        });
      }
      
      // Get the shop ID from the request or try to get from auth context
      let shop_id = shopId;
      
      // If shop_id is not provided, try to get it from the database
      if (!shop_id) {
        const { data: shopData } = await supabase
          .from('shopify_stores')
          .select('shop')
          .limit(1)
          .single();
          
        if (shopData && shopData.shop) {
          shop_id = shopData.shop;
        } else {
          return res.status(400).json({ 
            success: false, 
            error: 'Shop ID is required but could not be determined' 
          });
        }
      }
      
      // Insert or update the product settings
      const { data, error } = await supabase
        .from('shopify_product_settings')
        .upsert({
          product_id: productId,
          form_id: formId,
          block_id: blockId,
          enabled,
          shop_id: shop_id, // Add the required shop_id field
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'product_id,shop_id' // Update conflict strategy to match our schema
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving product settings:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save product settings' 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        productId: data.product_id,
        formId: data.form_id,
        blockId: data.block_id
      });
      
    } catch (error) {
      console.error('Error in product settings endpoint:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  } else {
    // Method not allowed
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed` 
    });
  }
}
