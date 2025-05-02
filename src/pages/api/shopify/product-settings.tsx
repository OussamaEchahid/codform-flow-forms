
// API endpoint for product settings
import type { NextApiRequest, NextApiResponse } from 'next';
import { ProductSettingsRequest, ProductSettingsResponse } from '@/lib/shopify/types';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProductSettingsResponse>
) {
  if (req.method === 'POST') {
    try {
      const { productId, formId, blockId, enabled = true }: ProductSettingsRequest = req.body;
      
      if (!productId || !formId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Product ID and Form ID are required' 
        });
      }
      
      // Insert or update the product settings
      const { data, error } = await supabase
        .from('shopify_product_settings')
        .upsert({
          product_id: productId,
          form_id: formId,
          block_id: blockId,
          enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'product_id'
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
