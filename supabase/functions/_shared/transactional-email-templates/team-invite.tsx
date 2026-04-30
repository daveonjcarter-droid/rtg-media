/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'RTG Media'
const SUPPORT_EMAIL = 'hello@runnerstogreatness.com'

interface TeamInviteProps {
  fullName?: string
  inviteType?: 'staff' | 'crew' | 'hybrid'
  roles?: string[]
  internalTitle?: string | null
  reportsToName?: string | null
  inviteUrl?: string
  expiresAt?: string
}

const formatRole = (r: string) =>
  r
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

const TeamInviteEmail = ({
  fullName,
  inviteType = 'staff',
  roles = [],
  internalTitle,
  reportsToName,
  inviteUrl = '#',
  expiresAt,
}: TeamInviteProps) => {
  const greeting = fullName ? `Welcome, ${fullName}.` : 'Welcome.'
  const headline = internalTitle
    ? internalTitle
    : roles.length > 0
      ? roles.map(formatRole).join(' / ')
      : 'Team Member'

  const typeBlurb =
    inviteType === 'crew'
      ? "You'll complete a crew profile, set your availability, upload portfolio work, and respond to booking requests assigned to you."
      : inviteType === 'hybrid'
        ? "You'll have internal staff access and a public crew profile — complete your profile, availability, and portfolio after signup."
        : "You'll have internal access to the studio dashboard for the tools tied to your role."

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You've been invited to join {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>RTG MEDIA · INVITATION</Text>
          <Heading style={h1}>{greeting}</Heading>
          <Text style={lede}>
            You've been invited to join <strong>{SITE_NAME}</strong> as{' '}
            <strong>{headline}</strong>.
          </Text>

          <Section style={card}>
            <Text style={cardLabel}>INVITE TYPE</Text>
            <Text style={cardValue}>{inviteType.toUpperCase()}</Text>

            {roles.length > 0 && (
              <>
                <Text style={cardLabel}>ASSIGNED ACCESS</Text>
                <Text style={cardValue}>{roles.map(formatRole).join(' · ')}</Text>
              </>
            )}

            {internalTitle && (
              <>
                <Text style={cardLabel}>INTERNAL TITLE</Text>
                <Text style={cardValue}>{internalTitle}</Text>
              </>
            )}

            {reportsToName && (
              <>
                <Text style={cardLabel}>REPORTS TO</Text>
                <Text style={cardValue}>{reportsToName}</Text>
              </>
            )}
          </Section>

          <Text style={text}>{typeBlurb}</Text>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={button} href={inviteUrl}>
              Accept invitation
            </Button>
          </Section>

          <Text style={smallText}>
            Or paste this link into your browser:
            <br />
            <span style={{ color: '#9b1c1c', wordBreak: 'break-all' }}>{inviteUrl}</span>
          </Text>

          {expiresAt && (
            <Text style={smallText}>
              This invitation expires on <strong>{expiresAt}</strong>.
            </Text>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Questions? Reach the studio at{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#9b1c1c' }}>
              {SUPPORT_EMAIL}
            </a>
            .
          </Text>
          <Text style={footerMuted}>
            If you weren't expecting this invitation, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TeamInviteEmail,
  subject: (data: Record<string, any>) =>
    `You've been invited to join ${SITE_NAME}${
      data?.internalTitle ? ` — ${data.internalTitle}` : ''
    }`,
  displayName: 'Team invitation',
  previewData: {
    fullName: 'Trinity',
    inviteType: 'hybrid',
    roles: ['social_articles_lead', 'editor', 'photographer'],
    internalTitle: 'Head of Social Media / Articles Lead',
    reportsToName: 'Brendyn Shields',
    inviteUrl: 'https://runnerstogreatness.com/accept-invite?token=sample',
    expiresAt: 'May 14, 2026',
  },
} satisfies TemplateEntry

// ---- Styles ----
const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}
const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '40px 28px',
}
const eyebrow: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.18em',
  color: '#9b1c1c',
  fontWeight: 700,
  margin: '0 0 12px',
}
const h1: React.CSSProperties = {
  fontSize: '32px',
  lineHeight: 1.1,
  fontWeight: 700,
  color: '#0a0a0a',
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
}
const lede: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: 1.55,
  color: '#1a1a1a',
  margin: '0 0 24px',
}
const text: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: 1.6,
  color: '#3a3a3a',
  margin: '0 0 16px',
}
const card: React.CSSProperties = {
  border: '1px solid #e5e5e5',
  borderRadius: '4px',
  padding: '20px 22px',
  margin: '0 0 24px',
  backgroundColor: '#fafafa',
}
const cardLabel: React.CSSProperties = {
  fontSize: '10px',
  letterSpacing: '0.16em',
  color: '#737373',
  fontWeight: 700,
  margin: '10px 0 4px',
}
const cardValue: React.CSSProperties = {
  fontSize: '14px',
  color: '#0a0a0a',
  fontWeight: 500,
  margin: '0 0 8px',
}
const button: React.CSSProperties = {
  backgroundColor: '#9b1c1c',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  padding: '14px 32px',
  borderRadius: '2px',
  display: 'inline-block',
}
const smallText: React.CSSProperties = {
  fontSize: '12px',
  color: '#737373',
  lineHeight: 1.6,
  margin: '0 0 12px',
}
const hr: React.CSSProperties = {
  borderColor: '#e5e5e5',
  margin: '32px 0 20px',
}
const footer: React.CSSProperties = {
  fontSize: '12px',
  color: '#525252',
  margin: '0 0 8px',
}
const footerMuted: React.CSSProperties = {
  fontSize: '11px',
  color: '#a3a3a3',
  margin: 0,
}
