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
  inviteCode?: string | null
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
  inviteUrl = 'https://runnerstogreatness.com/signup',
  inviteCode,
  expiresAt,
}: TeamInviteProps) => {
  const firstName = fullName ? fullName.trim().split(/\s+/)[0] : ''
  const greeting = firstName ? `Welcome, ${firstName}.` : "You've Been Invited."

  const hasRoles = roles.length > 0
  const hasMultipleRoles = roles.length > 1

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You've Been Invited to Join {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={brand}>RTG MEDIA</Heading>
            <Text style={brandSub}>You've been invited to join the team</Text>
          </Section>

          <Section style={cardOuter}>
            <Heading style={h1}>{greeting}</Heading>
            <Text style={lede}>
              You've been invited to join the {SITE_NAME} team. Click the link below to create
              your staff account and complete your profile.
            </Text>

            {(internalTitle || hasRoles) && (
              <Section style={accessBlock}>
                <Text style={accessLabel}>YOUR ROLE</Text>
                {internalTitle && <Text style={bullet}><span style={bulletDot}>•</span> {internalTitle}</Text>}
                {hasMultipleRoles
                  ? roles.map((r, i) => (
                      <Text key={i} style={bullet}>
                        <span style={bulletDot}>•</span> {formatRole(r)}
                      </Text>
                    ))
                  : !internalTitle && hasRoles && (
                      <Text style={bullet}><span style={bulletDot}>•</span> {formatRole(roles[0])}</Text>
                    )}
              </Section>
            )}

            {reportsToName && (
              <Text style={meta}>
                <span style={metaLabel}>Reports to: </span>
                <span style={metaValue}>{reportsToName}</span>
              </Text>
            )}

            <Section style={{ textAlign: 'center', margin: '32px 0 12px' }}>
              <Text style={{ ...accessLabel, textAlign: 'center', margin: '0 0 12px' }}>CREATE YOUR ACCOUNT</Text>
              <Button style={button} href={inviteUrl}>
                ACCEPT INVITATION
              </Button>
              <Text style={buttonSub}>
                Opens your secure RTG Media signup page.
              </Text>
            </Section>

            <Text style={smallText}>
              Or paste this link into your browser:
              <br />
              <span style={{ color: '#e11d2e', wordBreak: 'break-all' }}>{inviteUrl}</span>
            </Text>

            {inviteCode && (
              <Section style={codeBlock}>
                <Text style={codeLabel}>BACKUP INVITE CODE</Text>
                <Text style={codeValue}>{inviteCode}</Text>
                <Text style={codeHelp}>
                  If the link above doesn't work, go to{' '}
                  <span style={{ color: '#e11d2e' }}>runnerstogreatness.com/signup</span> and
                  enter this code manually. The code is single-use and tied to this email.
                </Text>
              </Section>
            )}

            {expiresAt && (
              <Text style={smallText}>
                This invitation expires on{' '}
                <strong style={{ color: '#f5f5f5' }}>{expiresAt}</strong>.
              </Text>
            )}

            <Text style={smallText}>
              If this invite was sent to you by mistake, you can ignore this email.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footerWrap}>
            <Text style={footerBrand}>RTG MEDIA</Text>
            <Text style={footerLine}>Runners to Greatness</Text>
            <Text style={footerLine}>Chicago, IL</Text>
            <Text style={footerMuted}>
              Questions? Reach the studio at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#e11d2e', textDecoration: 'none' }}>
                {SUPPORT_EMAIL}
              </a>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TeamInviteEmail,
  subject: () => `You've Been Invited to Join ${SITE_NAME}`,
  displayName: 'Team invitation',
  previewData: {
    fullName: 'Trinity',
    inviteType: 'hybrid',
    roles: ['social_articles_lead', 'editor', 'photographer'],
    internalTitle: 'Head of Social Media / Articles Lead',
    reportsToName: 'Brendyn Shields',
    inviteUrl: 'https://runnerstogreatness.com/signup?invite_token=sample',
    inviteCode: 'ABCD-EFGH-JKLM',
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
const codeBlock: React.CSSProperties = {
  border: '1px solid #2a2a2a',
  backgroundColor: '#0a0a0a',
  borderLeft: '3px solid #e11d2e',
  padding: '18px 20px',
  margin: '24px 0 16px',
}
const codeLabel: React.CSSProperties = {
  fontSize: '10px',
  letterSpacing: '0.22em',
  color: '#e11d2e',
  fontWeight: 700,
  margin: '0 0 8px',
}
const codeValue: React.CSSProperties = {
  fontSize: '20px',
  fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
  color: '#ffffff',
  letterSpacing: '0.08em',
  fontWeight: 700,
  margin: '0 0 10px',
}
const codeHelp: React.CSSProperties = {
  fontSize: '11px',
  color: '#a3a3a3',
  lineHeight: 1.55,
  margin: 0,
}
