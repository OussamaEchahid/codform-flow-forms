
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { ensureUUID } from '@/lib/shopify/types';

// Helper function to ensure UUID type for formId
function ensureFormUUID(formId: string): string {
  // If it's already a valid UUID, return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(formId)) {
    return formId;
  }
  
  // If it's not a valid UUID, log a warning
  console.warn(`Invalid UUID format detected in product-settings API: ${formId}`);
  return formId;
}

async function saveProductSetting(
  shopId: string,
  productId: string,
  formId: string,
  enabled: boolean = true,
  blockId?: string
) {
  try {
    // Convert formId to proper UUID format if needed
    const validFormId = ensureFormUUID(formId);
    
    // Use the RPC function we created in the database
    const { data, error } = await shopifySupabase.rpc('associate_product_with_form', {
      p_shop_id: shopId,
      p_product_id: productId,
      p_form_id: validFormId,
      p_block_id: blockId || null,
      p_enabled: enabled
    });

    if (error) {
      console.error("Error saving product setting:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Error in saveProductSetting:", error);
    return { success: false, error: error.message };
  }
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

// Function to remove product associations for a form
export async function removeFormProductAssociations(formId: string) {
  try {
    // Convert formId to proper UUID format if needed
    const validFormId = ensureFormUUID(formId);
    
    // Update the associations to disabled rather than deleting them
    const { error } = await shopifySupabase
      .from('shopify_product_settings')
      .update({ enabled: false })
      .eq('form_id', validFormId);
    
    if (error) {
      console.error("Error removing form product associations:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in removeFormProductAssociations:", error);
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
  } else if (method === 'DELETE') {
    const formId = url.searchParams.get('formId');
    
    if (formId) {
      const result = await removeFormProductAssociations(formId);
      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'Missing formId parameter' }),
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
