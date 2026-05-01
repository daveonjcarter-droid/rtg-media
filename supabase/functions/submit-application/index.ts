// Public endpoint: accepts application submissions.
// - Verifies Cloudflare Turnstile CAPTCHA
// - Rate limits by IP and email
// - Enforces 1 application per email
// - Computes completeness score & low-priority flag
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const Schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(40),
  city: z.string().trim().min(2).max(120),
  role_applying_for: z.string().trim().min(2).max(120),
  portfolio_url: z.string().trim().url().max(500),
  instagram_url: z.string().trim().url().max(500).optional().or(z.literal('')),
  linkedin_url: z.string().trim().url().max(500).optional().or(z.literal('')),
  why_join: z.string().trim().min(80).max(3000),
  experience: z.string().trim().min(80).max(3000),
  availability: z.string().trim().min(20).max(1500),
  experience_level: z.enum(['none','beginner','intermediate','professional']).optional(),
  resume_path: z.string().trim().max(500).optional().or(z.literal('')),
  resume_filename: z.string().trim().max(255).optional().or(z.literal('')),
  captcha_token: z.string().min(10),
})

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) return false
  const form = new FormData()
  form.set('secret', secret)
  form.set('response', token)
  if (ip) form.set('remoteip', ip)
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
    const j = await r.json()
    return !!j.success
  } catch { return false }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(url, serviceKey)

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null
  const ua = req.headers.get('user-agent') || null

  let body: any
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  const data = parsed.data

  // 1) CAPTCHA
  const ok = await verifyTurnstile(data.captcha_token, ip)
  if (!ok) {
    return new Response(JSON.stringify({ error: 'CAPTCHA verification failed. Please retry.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // 2) Rate limit (max 5 per hour per IP, 2 per day per email)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  if (ip) {
    const { count: ipCount } = await supabase
      .from('application_rate_limits').select('*', { head: true, count: 'exact' })
      .eq('ip_address', ip).gte('created_at', oneHourAgo)
    if ((ipCount ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: 'Too many submissions. Please try again later.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }
  const { count: emailCount } = await supabase
    .from('application_rate_limits').select('*', { head: true, count: 'exact' })
    .ilike('email', data.email).gte('created_at', oneDayAgo)
  if ((emailCount ?? 0) >= 2) {
    return new Response(JSON.stringify({ error: 'You have already submitted recently. Check your inbox for our reply.' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // 3) Duplicate check
  const { data: existing } = await supabase
    .from('applications').select('id').ilike('email', data.email).maybeSingle()
  if (existing) {
    return new Response(JSON.stringify({ error: 'An application with this email already exists. We have it on file.' }), {
      status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // 4) Score completeness (0-100)
  let score = 60 // base for required fields
  if (data.instagram_url) score += 5
  if (data.linkedin_url) score += 5
  if (data.resume_path) score += 10
  if (data.why_join.length > 250) score += 10
  if (data.experience.length > 250) score += 10
  if (score > 100) score = 100
  const isLowPriority = score < 70

  // 5) Insert
  const { data: inserted, error } = await supabase.from('applications').insert({
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    city: data.city,
    role_applying_for: data.role_applying_for,
    portfolio_url: data.portfolio_url,
    instagram_url: data.instagram_url || null,
    linkedin_url: data.linkedin_url || null,
    why_join: data.why_join,
    experience: data.experience,
    availability: data.availability,
    experience_level: data.experience_level || null,
    resume_path: data.resume_path || null,
    resume_filename: data.resume_filename || null,
    completeness_score: score,
    is_low_priority: isLowPriority,
    priority: isLowPriority ? 'low' : 'normal',
    captcha_verified: true,
    ip_address: ip,
    user_agent: ua,
  }).select('id').single()

  if (error) {
    console.error('Insert error', error)
    return new Response(JSON.stringify({ error: 'Could not save application. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // 6) Log rate limit
  await supabase.from('application_rate_limits').insert({ ip_address: ip ?? 'unknown', email: data.email })

  return new Response(JSON.stringify({ ok: true, id: inserted.id }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
