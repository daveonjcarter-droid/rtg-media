// Returns publishable client config (Turnstile site key etc.)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  return new Response(JSON.stringify({
    turnstile_site_key: Deno.env.get('TURNSTILE_SITE_KEY') ?? '',
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
