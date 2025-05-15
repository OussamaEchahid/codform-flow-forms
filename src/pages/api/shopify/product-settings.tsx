import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/supabase-admin';

type ProductSettings = {
  id: string;
  shop_id: string;
  product_id: string;
  form_id: string;
  block_id: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

async function saveProductSetting(
  shopId: string,
  productId: string,
  formId: string,
  enabled: boolean = true,
  blockId?: string
) {
  try {
    // Build the product settings object
    const productSettingsData = {
      shop_id: shopId,
      product_id: productId,
      form_id: formId,
      enabled: enabled,
      block_id: blockId || null
    };
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shopify_product_settings')
      .insert([productSettingsData])
      .select()

    if (error) {
      console.error("Error saving product setting:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error: any) {
    console.error("Error in saveProductSetting:", error);
    return { success: false, error: error.message };
  }
}

async function updateProductSetting(
  id: string,
  shopId: string,
  productId: string,
  formId: string,
  enabled: boolean = true,
  blockId?: string
) {
  try {
    const supabase = createClient();
      const productSettingsData = {
        shop_id: shopId,
        product_id: productId,
        form_id: formId,
        enabled: enabled,
        block_id: blockId || null
      };

    const { data, error } = await supabase
      .from('shopify_product_settings')
      .update(productSettingsData)
      .eq('id', id)
      .select();

    if (error) {
      console.error("Error updating product setting:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error: any) {
    console.error("Error in updateProductSetting:", error);
    return { success: false, error: error.message };
  }
}

async function deleteProductSetting(id: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shopify_product_settings')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error("Error deleting product setting:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error: any) {
    console.error("Error in deleteProductSetting:", error);
    return { success: false, error: error.message };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    // Extract data from the request body
    const { shopId, productId, formId, enabled, blockId } = req.body;

    // Check if required fields are present
    if (!shopId || !productId || !formId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Save the product setting to the database
    const result = await saveProductSetting(shopId, productId, formId, enabled, blockId);

    // Send the response
    if (result.success) {
      return res.status(200).json({ success: true, data: result.data });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } else if (req.method === 'PUT') {
    // Extract data from the request body
    const { id, shopId, productId, formId, enabled, blockId } = req.body;

    // Check if required fields are present
    if (!id || !shopId || !productId || !formId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Update the product setting in the database
    const result = await updateProductSetting(id, shopId, productId, formId, enabled, blockId);

    // Send the response
    if (result.success) {
      return res.status(200).json({ success: true, data: result.data });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } else if (req.method === 'DELETE') {
    // Extract the id from the query parameters
    const { id } = req.query;

    // Check if the id is present
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing id' });
    }

    // Delete the product setting from the database
    const result = await deleteProductSetting(id as string);

    // Send the response
    if (result.success) {
      return res.status(200).json({ success: true, data: result.data });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } else {
    // Return an error for unsupported request methods
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
}
