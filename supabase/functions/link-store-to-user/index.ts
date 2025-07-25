import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔗 Link Store to User function started');
    
    const { shop, user_id, email } = await req.json();
    
    if (!shop || !user_id) {
      throw new Error('Shop and user_id are required');
    }
    
    console.log(`🔄 Linking shop ${shop} to user ${user_id}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Update or insert the store with the user_id
    const { data: existingStore } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('shop', shop)
      .maybeSingle();
    
    if (existingStore) {
      console.log(`📝 Updating existing store ${shop} with user ${user_id}`);
      
      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update({ 
          user_id,
          email,
          updated_at: new Date().toISOString(),
          is_active: true
        })
        .eq('shop', shop);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`✅ Store ${shop} successfully linked to user ${user_id}`);
    } else {
      console.log(`📝 Creating new store ${shop} for user ${user_id}`);
      
      const { error: insertError } = await supabase
        .from('shopify_stores')
        .insert({
          shop,
          user_id,
          email,
          is_active: true,
          access_token: null,
          scope: null,
          token_type: 'Bearer'
        });
      
      if (insertError) {
        throw insertError;
      }
      
      console.log(`✅ Store ${shop} successfully created for user ${user_id}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Store ${shop} linked to user ${user_id}` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('❌ Error linking store to user:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});