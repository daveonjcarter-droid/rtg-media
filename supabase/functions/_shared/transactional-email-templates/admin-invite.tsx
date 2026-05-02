/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'RTG Media'
const SUPPORT_EMAIL = 'hello@runnerstogreatness.com'

interface AdminInviteProps {
  email?: string
  role?: string
  inviteCode?: string
  signupUrl?: string
}

const formatRole = (r: string) =>
  r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const AdminInviteEmail = ({
  email = '',
  role = 'admin',
  inviteCode = 'XXXX-XXXX-XXXX-XXXX',
  signupUrl = 'https://runnerstogreatness.com/signup',
}: AdminInviteProps) => {
  const url = `${signupUrl}?invite_code=${encodeURIComponent(inviteCode)}&email=${encodeURIComponent(email)}`
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your {SITE_NAME} invite code</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ textAlign: 'center', padding: '8px 0 28px' }}>
            <Heading style={brand}>RTG MEDIA</Heading>
            <Text style={brandSub}>Elevated access invitation</Text>
          </Section>

          <Section style={cardOuter}>
            <Heading style={h1}>You've been invited.</Heading>
            <Text style={lede}>
              You've been invited to join <strong style={{ color: '#fff' }}>{SITE_NAME}</strong> as{' '}
              <strong style={{ color: '#fff' }}>{formatRole(role)}</strong>.
            </Text>

            <Section style={codeBlock}>
              <Text style={codeLabel}>YOUR INVITE CODE</Text>
              <Text style={codeValue}>{inviteCode}</Text>
            </Section>

            <Text style={text}>
              Use this code when you sign up. It is one-time use and must be used with the
              same email address this invite was sent to (<span style={{ color: '#fff' }}>{email}</span>).
            </Text>

            <Section style={{ textAlign: 'center', margin: '36px 0 12px' }}>
              <Button style={button} href={url}>SIGN UP</Button>
              <Text style={buttonSub}>Opens the secure signup page</Text>
            </Section>

            <Text style={smallText}>
              Or paste this link into your browser:<br />
              <span style={{ color: '#e11d2e', wordBreak: 'break-all' }}>{url}</span>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={{ textAlign: 'center' }}>
            <Text style={footerBrand}>RTG MEDIA</Text>
            <Text style={footerLine}>Runners To Greatness · Chicago</Text>
            <Text style={footerMuted}>
              Questions? Reach the studio at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#e11d2e', textDecoration: 'none' }}>
                {SUPPORT_EMAIL}
              </a>.
            </Text>
            <Text style={footerMuted}>
              If you didn't expect this invite, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AdminInviteEmail,
  subject: () => `Your ${SITE_NAME} invite code`,
  displayName: 'Admin invite code',
  previewData: {
    email: 'invitee@example.com',
    role: 'admin',
    inviteCode: 'ABCD-EFGH-IJKL-MNOP',
    signupUrl: 'https://runnerstogreatness.com/signup',
  },
} satisfies TemplateEntry

const main: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0, padding: 0, color: '#f5f5f5',
}
const container: React.CSSProperties = {
  maxWidth: '600px', margin: '0 auto', padding: '40px 24px 32px', backgroundColor: '#0a0a0a',
}
const brand: React.CSSProperties = {
  fontSize: '22px', letterSpacing: '0.32em', fontWeight: 800, color: '#ffffff', margin: '0 0 8px',
}
const brandSub: React.CSSProperties = {
  fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase',
  color: '#a3a3a3', margin: 0, fontWeight: 600,
}
const cardOuter: React.CSSProperties = {
  backgroundColor: '#111111', border: '1px solid #1f1f1f', borderRadius: '6px', padding: '36px 32px',
}
const h1: React.CSSProperties = {
  fontSize: '30px', lineHeight: 1.15, fontWeight: 700, color: '#ffffff',
  margin: '0 0 14px', letterSpacing: '-0.01em',
}
const lede: React.CSSProperties = {
  fontSize: '16px', lineHeight: 1.55, color: '#e5e5e5', margin: '0 0 22px',
}
const codeBlock: React.CSSProperties = {
  border: '1px solid #2a2a2a', backgroundColor: '#0a0a0a',
  borderLeft: '3px solid #e11d2e', padding: '18px 20px', margin: '0 0 22px',
}
const codeLabel: React.CSSProperties = {
  fontSize: '10px', letterSpacing: '0.22em', color: '#e11d2e', fontWeight: 700, margin: '0 0 8px',
}
const codeValue: React.CSSProperties = {
  fontSize: '22px', fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
  color: '#ffffff', letterSpacing: '0.08em', fontWeight: 700, margin: 0,
}
const text: React.CSSProperties = {
  fontSize: '14px', lineHeight: 1.65, color: '#d4d4d4', margin: '0 0 8px',
}
const button: React.CSSProperties = {
  backgroundColor: '#e11d2e', color: '#ffffff', fontSize: '13px', fontWeight: 700,
  letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none',
  padding: '16px 38px', borderRadius: '2px', display: 'inline-block',
}
const buttonSub: React.CSSProperties = {
  fontSize: '12px', color: '#a3a3a3', margin: '14px 0 0', textAlign: 'center' as const,
}
const smallText: React.CSSProperties = {
  fontSize: '12px', color: '#737373', lineHeight: 1.6, margin: '0 0 12px',
}
const hr: React.CSSProperties = {
  border: 'none', borderTop: '1px solid #262626', margin: '32px 0 24px',
}
const footerBrand: React.CSSProperties = {
  fontSize: '12px', letterSpacing: '0.28em', fontWeight: 700, color: '#f5f5f5', margin: '0 0 6px',
}
const footerLine: React.CSSProperties = {
  fontSize: '12px', color: '#a3a3a3', margin: '0 0 2px',
}
const footerMuted: React.CSSProperties = {
  fontSize: '11px', color: '#737373', margin: '14px 0 0', lineHeight: 1.6,
}
