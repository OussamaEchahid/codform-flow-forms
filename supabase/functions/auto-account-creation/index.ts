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
    
    const { shop, email, access_token } = await req.json();
    
    if (!shop || !email) {
      console.error('❌ Missing required fields: shop or email');
      return new Response(
        JSON.stringify({ success: false, error: 'Shop and email are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log(`🔄 Processing auto account creation for ${email} and shop ${shop}`);

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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

    const existingUser = existingUsers.users.find(user => user.email === email);
    let userId: string;

    if (existingUser) {
      console.log(`👤 User already exists: ${email}`);
      userId = existingUser.id;
    } else {
      console.log(`➕ Creating new user for: ${email}`);
      
      // Generate a temporary random password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!${Date.now().toString().slice(-4)}`;
      
      // Create new user with admin API
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email for Shopify users
        user_metadata: {
          created_via: 'shopify_auto',
          shop: shop,
          temp_password: true
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
        email: email,
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId, 
        is_new_user: !existingUser,
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