import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url);
    let action = url.searchParams.get('action') || '';
    let jsonBody: any = null;
    if (!action && req.method !== 'GET') {
      try {
        jsonBody = await req.json();
        action = (jsonBody?.action as string) || '';
      } catch (_) {
        // ignore
      }
    }

    if ((req.method === 'POST') && action === 'create-config') {
      const configData = jsonBody ?? await req.json();

      const { data, error } = await supabase
        .from('google_sheets_configs')
        .insert({
          sheet_id: configData.sheet_id,
          sheet_name: configData.sheet_name,
          webhook_url: configData.webhook_url,
          enabled: configData.enabled ?? true,
          sync_orders: configData.sync_orders ?? true,
          sync_submissions: configData.sync_submissions ?? false,
          shop_id: configData.shop_id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating Google Sheets config:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create Google Sheets config' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, config: data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if ((req.method === 'GET' || req.method === 'POST') && action === 'list-configs') {
      const { data, error } = await supabase
        .from('google_sheets_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Google Sheets configs:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch Google Sheets configs' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ configs: data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if ((req.method === 'PUT' || req.method === 'POST') && action === 'update-config') {
      const { config_id, ...updateData } = jsonBody ?? await req.json();

      const { data, error } = await supabase
        .from('google_sheets_configs')
        .update(updateData)
        .eq('id', config_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating Google Sheets config:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update Google Sheets config' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, config: data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if ((req.method === 'POST') && action === 'test-webhook') {
      const { webhook_url } = (jsonBody ?? await req.json());

      try {
        const response = await fetch(webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'test',
            message: 'Test connection from your application',
            timestamp: new Date().toISOString()
          }),
        });

        if (response.ok) {
          return new Response(
            JSON.stringify({ success: true, message: 'Webhook test successful' }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (webhookError) {
        console.error('Webhook test failed:', webhookError);
        return new Response(
          JSON.stringify({ success: false, error: 'Webhook test failed' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Delete config
    if ((req.method === 'DELETE' || req.method === 'POST') && action === 'delete-config') {
      const { config_id } = (jsonBody ?? await req.json());
      if (!config_id) {
        return new Response(JSON.stringify({ error: 'config_id_required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { error } = await supabase
        .from('google_sheets_configs')
        .delete()
        .eq('id', config_id);
      if (error) {
        console.error('Error deleting Google Sheets config:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete Google Sheets config' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});