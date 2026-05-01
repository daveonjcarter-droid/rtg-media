// Admin-only endpoint: approves an application, creates an invite, sends invite email.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PUBLIC_SITE_URL = 'https://runnerstogreatness.com'

const Schema = z.object({
  application_id: z.string().uuid(),
  roles: z.array(z.string()).min(1),
  invite_type: z.enum(['staff', 'crew', 'hybrid']),
  internal_title: z.string().trim().max(160).optional().nullable(),
})

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Verify caller
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
  const token = authHeader.replace('Bearer ', '')
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token)
  if (claimsErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const userId = claims.claims.sub as string

  const admin = createClient(url, serviceKey)
  // Role check
  const { data: roleRows } = await admin.from('user_roles').select('role').eq('user_id', userId)
  const roles = (roleRows ?? []).map(r => r.role)
  if (!roles.includes('admin') && !roles.includes('head_admin')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Parse body
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
  const { application_id, roles: assignRoles, invite_type, internal_title } = parsed.data

  // Load application
  const { data: app, error: appErr } = await admin.from('applications').select('*').eq('id', application_id).maybeSingle()
  if (appErr || !app) {
    return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Check existing invite for that email
  const { data: existingInvite } = await admin.from('invited_users').select('id, invite_token').ilike('email', app.email).maybeSingle()
  let inviteId = existingInvite?.id as string | undefined
  let inviteToken = existingInvite?.invite_token as string | undefined

  if (!inviteId) {
    inviteToken = generateToken()
    const inviteUrl = `${PUBLIC_SITE_URL}/signup?invite_token=${inviteToken}`
    const { data: created, error: createErr } = await admin.from('invited_users').insert({
      email: app.email,
      full_name: app.full_name,
      invite_type,
      roles: assignRoles,
      internal_title: internal_title || app.role_applying_for,
      invited_by: userId,
      invite_token: inviteToken,
      invite_url: inviteUrl,
      email_delivery_status: 'pending',
      status: 'pending',
    }).select('id').single()
    if (createErr || !created) {
      return new Response(JSON.stringify({ error: createErr?.message ?? 'Could not create invite' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    inviteId = created.id
  }

  const inviteUrl = `${PUBLIC_SITE_URL}/signup?invite_token=${inviteToken}`

  // Send invite email
  let emailError: string | null = null
  try {
    const { error: sendErr } = await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'team-invite',
        recipientEmail: app.email,
        idempotencyKey: `application-invite-${application_id}-${Date.now()}`,
        templateData: {
          fullName: app.full_name,
          inviteType: invite_type,
          roles: assignRoles,
          internalTitle: internal_title || app.role_applying_for,
          reportsToName: null,
          inviteUrl,
        },
      },
    })
    if (sendErr) throw sendErr
    await admin.from('invited_users').update({
      email_delivery_status: 'sent',
      email_sent_at: new Date().toISOString(),
      email_error: null,
    }).eq('id', inviteId)
  } catch (e: any) {
    emailError = e?.message ?? String(e)
    await admin.from('invited_users').update({
      email_delivery_status: 'failed',
      email_error: emailError,
    }).eq('id', inviteId)
  }

  // Update application
  await admin.from('applications').update({
    status: emailError ? 'approved' : 'invited',
    invite_id: inviteId,
    invited_at: emailError ? null : new Date().toISOString(),
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
  }).eq('id', application_id)

  return new Response(JSON.stringify({
    ok: !emailError,
    invite_id: inviteId,
    invite_url: inviteUrl,
    email_error: emailError,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
