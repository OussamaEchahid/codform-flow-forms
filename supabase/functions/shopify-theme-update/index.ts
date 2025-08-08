import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Deprecated: Direct theme edits via Assets/ScriptTag are no longer supported.
// Merchants must enable the Theme App Extension (codform) from the Theme Editor.
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      success: false,
      code: 'DEPRECATED',
      message:
        'This endpoint was deprecated. Please enable the CODFORM Theme App Extension block in the theme editor (Online Store > Customize).',
    }),
    { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
