import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Auto Account Creation function started');
    
    const { shop, access_token } = await req.json();
    
    if (!shop) {
      console.error('❌ Missing required field: shop');
      return new Response(
        JSON.stringify({ success: false, error: 'Shop is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log(`🔄 Processing auto account creation for shop ${shop}`);

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get real email from Shopify API
    let realEmail: string;
    
    if (access_token) {
      try {
        console.log('📧 Fetching real email from Shopify API...');
        
        const shopInfoUrl = `https://${shop}/admin/api/2024-04/shop.json`;
        const shopInfoResponse = await fetch(shopInfoUrl, {
          headers: {
            'X-Shopify-Access-Token': access_token,
            'Content-Type': 'application/json'
          }
        });
        
        if (shopInfoResponse.ok) {
          const shopInfoData = await shopInfoResponse.json();
          realEmail = shopInfoData.shop.email;
          console.log(`✅ Got real email from Shopify: ${realEmail}`);
        } else {
          throw new Error(`Shopify API error: ${shopInfoResponse.status}`);
        }
      } catch (error) {
        console.error('❌ Failed to get email from Shopify:', error);
        // Fallback to shop-based email if API fails
        realEmail = `admin@${shop.replace('.myshopify.com', '')}.store`;
        console.log(`🔄 Using fallback email: ${realEmail}`);
      }
    } else {
      // If no access token, use shop-based email
      realEmail = `admin@${shop.replace('.myshopify.com', '')}.store`;
      console.log(`⚠️ No access token provided, using fallback email: ${realEmail}`);
    }

    // Check if user already exists
    const { data: existingUsers, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('❌ Error checking existing users:', getUserError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to check existing users' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const existingUser = existingUsers.users.find(user => user.email === realEmail);
    let userId: string;

    if (existingUser) {
      console.log(`👤 User already exists: ${realEmail}`);
      userId = existingUser.id;
    } else {
      console.log(`➕ Creating new user for: ${realEmail}`);
      
      // Generate a temporary random password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!${Date.now().toString().slice(-4)}`;
      
      // Create new user with admin API
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: realEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email for Shopify users
        user_metadata: {
          created_via: 'shopify_auto',
          shop: shop,
          temp_password: true,
          real_shopify_email: true
        }
      });

      if (createUserError) {
        console.error('❌ Error creating user:', createUserError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create user account' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      userId = newUser.user.id;
      console.log(`✅ New user created with ID: ${userId}`);
    }

    // Link or update the store with the user
    const { error: linkError } = await supabase
      .from('shopify_stores')
      .upsert({
        shop: shop,
        user_id: userId,
        email: realEmail,
        access_token: access_token || null,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'shop',
        ignoreDuplicates: false
      });

    if (linkError) {
      console.error('❌ Error linking store to user:', linkError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to link store to user account' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log(`✅ Store ${shop} successfully linked to user ${userId}`);

    // Create session for auto login
    let sessionData = null;
    try {
      const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: realEmail,
        options: {
          redirectTo: `${Deno.env.get('FRONTEND_URL') || 'https://codmagnet.com'}/dashboard?connected=true&shop=${encodeURIComponent(shop)}`
        }
      });

      if (!sessionError && session) {
        sessionData = {
          access_token: session.properties?.access_token,
          refresh_token: session.properties?.refresh_token,
          expires_at: session.properties?.expires_at,
          user: session.user
        };
        console.log('✅ Auto login session created');
      }
    } catch (sessionError) {
      console.log('⚠️ Auto login session creation failed, user will need to login manually:', sessionError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId, 
        is_new_user: !existingUser,
        session: sessionData,
        email: realEmail,
        shop: shop,
        message: existingUser ? 'Store linked to existing account' : 'New account created and store linked'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error in auto account creation:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});