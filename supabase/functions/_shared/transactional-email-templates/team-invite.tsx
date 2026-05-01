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
  const firstName = fullName ? fullName.trim().split(/\s+/)[0] : ''
  const greeting = firstName ? `Welcome, ${firstName}.` : 'Welcome to RTG Media.'

  const hasMultipleRoles = roles.length > 1
  const roleIntro = internalTitle
    ? `You've been invited to join RTG Media in the role of ${internalTitle}.`
    : hasMultipleRoles
      ? "You've been granted access to the following areas:"
      : roles.length === 1
        ? `You've been invited to join RTG Media in the role of ${formatRole(roles[0])}.`
        : "You've been invited to join the RTG Media team."

  const typeBlurb =
    inviteType === 'crew'
      ? "You'll complete a crew profile, set your availability, upload portfolio work, and respond to booking requests assigned to you."
      : inviteType === 'hybrid'
        ? "You'll have access to RTG Media's Studio Dashboard and a public crew profile — manage your tools, content, availability, and portfolio in one place."
        : "You'll have access to RTG Media's Studio Dashboard, where you can manage your tools, content, and assignments."

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You've been invited to join {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={brand}>RTG MEDIA</Heading>
            <Text style={brandSub}>You've been invited to join the team</Text>
          </Section>

          <Section style={cardOuter}>
            <Heading style={h1}>{greeting}</Heading>
            <Text style={lede}>{roleIntro}</Text>

            {hasMultipleRoles && !internalTitle && (
              <Section style={accessBlock}>
                <Text style={accessLabel}>ASSIGNED ACCESS</Text>
                {roles.map((r, i) => (
                  <Text key={i} style={bullet}>
                    <span style={bulletDot}>•</span> {formatRole(r)}
                  </Text>
                ))}
              </Section>
            )}

            {internalTitle && roles.length > 0 && (
              <Section style={accessBlock}>
                <Text style={accessLabel}>ASSIGNED ACCESS</Text>
                {roles.map((r, i) => (
                  <Text key={i} style={bullet}>
                    <span style={bulletDot}>•</span> {formatRole(r)}
                  </Text>
                ))}
              </Section>
            )}

            {reportsToName && (
              <Text style={meta}>
                <span style={metaLabel}>Reports to: </span>
                <span style={metaValue}>{reportsToName}</span>
              </Text>
            )}

            <Text style={text}>{typeBlurb}</Text>

            <Section style={{ textAlign: 'center', margin: '36px 0 12px' }}>
              <Button style={button} href={inviteUrl}>
                ACCEPT INVITATION
              </Button>
              <Text style={buttonSub}>
                This link will take you to your secure signup page.
              </Text>
            </Section>

            <Text style={smallText}>
              Or paste this link into your browser:
              <br />
              <span style={{ color: '#e11d2e', wordBreak: 'break-all' }}>{inviteUrl}</span>
            </Text>

            {expiresAt && (
              <Text style={smallText}>
                This invitation expires on <strong style={{ color: '#f5f5f5' }}>{expiresAt}</strong>.
              </Text>
            )}
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footerWrap}>
            <Text style={footerBrand}>RTG MEDIA</Text>
            <Text style={footerLine}>Runners To Greatness</Text>
            <Text style={footerLine}>Chicago, IL</Text>
            <Text style={footerMuted}>
              Questions? Reach the studio at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#e11d2e', textDecoration: 'none' }}>
                {SUPPORT_EMAIL}
              </a>
              .
            </Text>
            <Text style={footerMuted}>
              If you didn't request this invite, you can ignore this email.
            </Text>
          </Section>
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
    inviteUrl: 'https://runnerstogreatness.com/signup?invite_token=sample',
    expiresAt: 'May 14, 2026',
  },
} satisfies TemplateEntry

// ---- Styles: dark luxury ----
const main: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
  color: '#f5f5f5',
}
const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '40px 24px 32px',
  backgroundColor: '#0a0a0a',
}
const headerSection: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '8px 0 28px',
}
const brand: React.CSSProperties = {
  fontSize: '22px',
  letterSpacing: '0.32em',
  fontWeight: 800,
  color: '#ffffff',
  margin: '0 0 8px',
}
const brandSub: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#a3a3a3',
  margin: 0,
  fontWeight: 600,
}
const cardOuter: React.CSSProperties = {
  backgroundColor: '#111111',
  border: '1px solid #1f1f1f',
  borderRadius: '6px',
  padding: '36px 32px',
}
const h1: React.CSSProperties = {
  fontSize: '30px',
  lineHeight: 1.15,
  fontWeight: 700,
  color: '#ffffff',
  margin: '0 0 14px',
  letterSpacing: '-0.01em',
}
const lede: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: 1.55,
  color: '#e5e5e5',
  margin: '0 0 22px',
}
const accessBlock: React.CSSProperties = {
  borderLeft: '2px solid #e11d2e',
  paddingLeft: '16px',
  margin: '0 0 22px',
}
const accessLabel: React.CSSProperties = {
  fontSize: '10px',
  letterSpacing: '0.22em',
  color: '#e11d2e',
  fontWeight: 700,
  margin: '0 0 10px',
}
const bullet: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.7,
  color: '#f5f5f5',
  margin: '0',
}
const bulletDot: React.CSSProperties = {
  color: '#e11d2e',
  marginRight: '8px',
  fontWeight: 700,
}
const meta: React.CSSProperties = {
  fontSize: '13px',
  color: '#d4d4d4',
  margin: '0 0 18px',
}
const metaLabel: React.CSSProperties = {
  color: '#a3a3a3',
  letterSpacing: '0.06em',
}
const metaValue: React.CSSProperties = {
  color: '#ffffff',
  fontWeight: 600,
}
const text: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: 1.65,
  color: '#d4d4d4',
  margin: '0 0 8px',
}
const button: React.CSSProperties = {
  backgroundColor: '#e11d2e',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  padding: '16px 38px',
  borderRadius: '2px',
  display: 'inline-block',
}
const buttonSub: React.CSSProperties = {
  fontSize: '12px',
  color: '#a3a3a3',
  margin: '14px 0 0',
  textAlign: 'center' as const,
}
const smallText: React.CSSProperties = {
  fontSize: '12px',
  color: '#737373',
  lineHeight: 1.6,
  margin: '0 0 12px',
}
const hr: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #262626',
  margin: '32px 0 24px',
}
const footerWrap: React.CSSProperties = {
  textAlign: 'center' as const,
}
const footerBrand: React.CSSProperties = {
  fontSize: '12px',
  letterSpacing: '0.28em',
  fontWeight: 700,
  color: '#f5f5f5',
  margin: '0 0 6px',
}
const footerLine: React.CSSProperties = {
  fontSize: '12px',
  color: '#a3a3a3',
  margin: '0 0 2px',
}
const footerMuted: React.CSSProperties = {
  fontSize: '11px',
  color: '#737373',
  margin: '14px 0 0',
  lineHeight: 1.6,
}
