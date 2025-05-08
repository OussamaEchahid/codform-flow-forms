
// Create a database trigger to automatically update the updated_at column
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // This is necessary for CORS to work
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Create client with service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
    
    // Check if the function trigger already exists
    const { data: existingTrigger, error: checkError } = await supabaseAdmin.rpc('check_trigger_exists', {
      trigger_name: 'update_forms_updated_at'
    });
    
    if (checkError) {
      console.error("Error checking if trigger exists:", checkError);
      throw new Error(`Failed to check if trigger exists: ${checkError.message}`);
    }
    
    // Only create the trigger if it doesn't exist
    if (!existingTrigger) {
      // Create the update_modified_column function if it doesn't exist
      const { error: functionError } = await supabaseAdmin.rpc('create_update_timestamp_function');
      
      if (functionError) {
        console.error("Error creating update timestamp function:", functionError);
        throw new Error(`Failed to create timestamp function: ${functionError.message}`);
      }
      
      // Create the trigger for the forms table
      const { error: triggerError } = await supabaseAdmin.rpc('create_timestamp_trigger', {
        table_name: 'forms'
      });
      
      if (triggerError) {
        console.error("Error creating trigger:", triggerError);
        throw new Error(`Failed to create trigger: ${triggerError.message}`);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: "Database trigger created successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: true, message: "Trigger already exists, no action taken" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error executing function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
