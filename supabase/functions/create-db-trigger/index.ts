
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Check if submitbuttontext column exists in forms table
    const { data: columnExists, error: columnCheckError } = await supabaseAdmin
      .rpc('check_column_exists', { p_table: 'forms', p_column: 'submitbuttontext' });

    if (columnCheckError) {
      console.error('Error checking if column exists:', columnCheckError);
      throw columnCheckError;
    }

    if (!columnExists) {
      // Add submitbuttontext column if it doesn't exist
      const { error: addColumnError } = await supabaseAdmin
        .rpc('add_column_if_not_exists', {
          p_table: 'forms', 
          p_column: 'submitbuttontext', 
          p_type: 'text', 
          p_default: "'إرسال الطلب'"
        });

      if (addColumnError) {
        console.error('Error adding column:', addColumnError);
        throw addColumnError;
      }

      console.log('Added submitbuttontext column to forms table');
    }

    // Check if the trigger already exists
    const { data: triggerExists, error: triggerCheckError } = await supabaseAdmin
      .rpc('check_trigger_exists', { trigger_name: 'update_forms_updated_at' });

    if (triggerCheckError) {
      console.error('Error checking if trigger exists:', triggerCheckError);
      throw triggerCheckError;
    }

    let message = '';

    if (!triggerExists) {
      // Create the timestamp trigger for the forms table
      const { error: createTriggerError } = await supabaseAdmin
        .rpc('create_timestamp_trigger', { table_name: 'forms' });

      if (createTriggerError) {
        console.error('Error creating trigger:', createTriggerError);
        throw createTriggerError;
      }
      
      message = 'Database trigger created successfully';
      console.log('Created update_forms_updated_at trigger');
    } else {
      message = 'Trigger already exists, no action taken';
      console.log('Trigger already exists, no action taken');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error executing create-db-trigger function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
