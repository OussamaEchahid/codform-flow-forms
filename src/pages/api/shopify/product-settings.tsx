
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import type { ProductSettingsRequest, ProductSettingsResponse } from '@/lib/shopify/types';

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
    // Check if this product is already associated with another form
    const { data: existingSettings } = await shopifySupabase
      .from('shopify_product_settings')
      .select('*')
      .eq('product_id', productId)
      .eq('shop_id', shopId);
      
    // If there's an existing association for this product
    if (existingSettings && existingSettings.length > 0) {
      // Update existing association instead of creating a new one
      const { data, error } = await shopifySupabase
        .from('shopify_product_settings')
        .update({
          form_id: formId,
          enabled: enabled,
          block_id: blockId || null
        })
        .eq('product_id', productId)
        .eq('shop_id', shopId)
        .select();
        
      if (error) throw error;
      return { success: true, data: data[0], updated: true };
    }
    
    // Build the product settings object for new association
    const productSettingsData = {
      shop_id: shopId,
      product_id: productId,
      form_id: formId,
      enabled: enabled,
      block_id: blockId || null
    };
    
    const { data, error } = await shopifySupabase
      .from('shopify_product_settings')
      .insert([productSettingsData])
      .select();

    if (error) {
      console.error("Error saving product setting:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0], updated: false };
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
    const shopifySupabase = createClient();
      const productSettingsData = {
        shop_id: shopId,
        product_id: productId,
        form_id: formId,
        enabled: enabled,
        block_id: blockId || null
      };

    const { data, error } = await shopifySupabase
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
    const shopifySupabase = createClient();
    const { data, error } = await shopifySupabase
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

// Helper function to create the Supabase client
function createClient() {
  return shopifySupabase;
}

// Function to check if a product is already associated with another form
export async function checkProductAssociation(shopId: string, productId: string) {
  try {
    const { data, error } = await shopifySupabase
      .from('shopify_product_settings')
      .select('form_id')
      .eq('product_id', productId)
      .eq('shop_id', shopId)
      .eq('enabled', true)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error("Error checking product association:", error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      hasAssociation: !!data, 
      formId: data?.form_id 
    };
  } catch (error: any) {
    console.error("Error checking product association:", error);
    return { success: false, error: error.message };
  }
}

// API handler
export default async function handler(req: Request) {
  // Extract request body
  const body = await req.json().catch(() => ({}));
  
  // Extract URL params if needed
  const url = new URL(req.url);
  const method = req.method;

  if (method === 'POST') {
    // Extract data from the request body
    const { shopId, productId, formId, enabled, blockId } = body;

    // Check if required fields are present
    if (!shopId || !productId || !formId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Save the product setting to the database
    const result = await saveProductSetting(shopId, productId, formId, enabled, blockId);

    // Send the response
    if (result.success) {
      return new Response(
        JSON.stringify({ success: true, data: result.data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else if (method === 'PUT') {
    // Extract data from the request body
    const { id, shopId, productId, formId, enabled, blockId } = body;

    // Check if required fields are present
    if (!id || !shopId || !productId || !formId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the product setting in the database
    const result = await updateProductSetting(id, shopId, productId, formId, enabled, blockId);

    // Send the response
    if (result.success) {
      return new Response(
        JSON.stringify({ success: true, data: result.data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else if (method === 'DELETE') {
    // Extract the id from the query parameters
    const id = url.searchParams.get('id');

    // Check if the id is present
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete the product setting from the database
    const result = await deleteProductSetting(id);

    // Send the response
    if (result.success) {
      return new Response(
        JSON.stringify({ success: true, data: result.data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else if (method === 'GET') {
    // Check if we're looking for product associations
    const shopId = url.searchParams.get('shopId');
    const productId = url.searchParams.get('productId');
    
    if (shopId && productId) {
      const result = await checkProductAssociation(shopId, productId);
      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return an error for other GET requests
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } else {
    // Return an error for unsupported request methods
    return new Response(
      JSON.stringify({ success: false, error: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
