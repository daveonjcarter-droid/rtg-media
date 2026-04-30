// Returns visitor's country/city from edge headers (Cloudflare / Supabase Edge runtime).
// Used by the public tracking pixel — no auth required.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const country =
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("x-country-code") ??
    null;
  const city =
    req.headers.get("cf-ipcity") ??
    req.headers.get("x-vercel-ip-city") ??
    req.headers.get("x-city") ??
    null;

  return new Response(JSON.stringify({ country, city }), {
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    status: 200,
  });
});
