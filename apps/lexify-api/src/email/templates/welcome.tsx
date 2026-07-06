import * as React from 'react';
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';

interface LexifyWelcomeEmailProps {
  userFirstname: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://youtubelexify.com';

export const LexifyWelcomeEmail = ({ userFirstname }: LexifyWelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Lexify — hover any subtitle word to define it instantly!</Preview>
    <Body style={main}>
      <Container style={container}>

        {/* ── Header bar ───────────────────────────────────────── */}
        <Section style={headerBar}>
          <Text style={logoText}>Lexify</Text>
          <Text style={tagline}>Understand Every Word. Instantly.</Text>
        </Section>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <Section style={heroSection}>
          <Heading style={h1}>Welcome aboard, {userFirstname}! 🎉</Heading>
          <Text style={heroBody}>
            You're all set to build your vocabulary effortlessly while watching YouTube.
            Just hover over any subtitle word and Lexify defines it in context — no tab switching,
            no dictionary apps, no friction.
          </Text>
        </Section>

        <Hr style={divider} />

        {/* ── Features 2×2 ─────────────────────────────────────── */}
        <Section style={featuresSection}>
          <Text style={sectionLabel}>WHAT YOU CAN DO</Text>

          <Row>
            <Column style={featureCell}>
              <Section style={featureCard}>
                <Text style={featureEmoji}>🎯</Text>
                <Text style={featureTitle}>Hover to Define</Text>
                <Text style={featureBody}>
                  Simply hover any highlighted subtitle word and an instant definition card appears — no clicking, no interruptions.
                </Text>
              </Section>
            </Column>
            <Column style={featureCell}>
              <Section style={featureCard}>
                <Text style={featureEmoji}>🤖</Text>
                <Text style={featureTitle}>AI Context</Text>
                <Text style={featureBody}>
                  AI understands what the word means in that exact sentence, so definitions are precise and actually useful.
                </Text>
              </Section>
            </Column>
          </Row>

          <Row style={{ marginTop: '12px' }}>
            <Column style={featureCell}>
              <Section style={featureCard}>
                <Text style={featureEmoji}>📚</Text>
                <Text style={featureTitle}>Auto Vocabulary Tracker</Text>
                <Text style={featureBody}>
                  Every word you look up is saved to your dashboard with the video timestamp and sentence context.
                </Text>
              </Section>
            </Column>
            <Column style={featureCell}>
              <Section style={featureCard}>
                <Text style={featureEmoji}>📤</Text>
                <Text style={featureTitle}>Export Anywhere</Text>
                <Text style={featureBody}>
                  Export your word list as CSV and import into Anki, Quizlet, or any study app — your vocab, your way.
                </Text>
              </Section>
            </Column>
          </Row>
        </Section>

        <Hr style={divider} />

        {/* ── CTA ──────────────────────────────────────────────── */}
        <Section style={ctaSection}>
          <Heading style={h2}>Ready to start learning?</Heading>
          <Text style={ctaBody}>
            Your dashboard is waiting. Head to YouTube, turn on captions, and hover your first word.
          </Text>
          <Button href={`${APP_URL}/dashboard`} style={button}>
            Go to Your Dashboard →
          </Button>
        </Section>

        <Hr style={divider} />

        {/* ── Footer ───────────────────────────────────────────── */}
        <Section style={footerSection}>
          <Text style={footerText}>
            Happy learning,
            <br />
            <strong>The Lexify Team</strong>
          </Text>
          <Text style={footerLinks}>
            <Link href={`${APP_URL}`} style={footerLink}>Website</Link>
            {' · '}
            <Link href={`${APP_URL}/dashboard`} style={footerLink}>Dashboard</Link>
            {' · '}
            <Link href={`${APP_URL}/privacy`} style={footerLink}>Privacy Policy</Link>
          </Text>
          <Text style={footerDisclaimer}>
            You received this email because you created a Lexify account.
            <br />
            © {new Date().getFullYear()} YouTube Lexify. All rights reserved.
          </Text>
        </Section>

      </Container>
    </Body>
  </Html>
);

export default LexifyWelcomeEmail;

// ─── Styles ───────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: '#F0F4F8',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  padding: '40px 0',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '20px',
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
  border: '1px solid #E2E6EB',
};

const headerBar: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%)',
  padding: '32px 48px',
  textAlign: 'center',
};

const logoText: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '800',
  margin: '0 0 4px 0',
  letterSpacing: '-0.5px',
};

const tagline: React.CSSProperties = {
  color: 'rgba(255,255,255,0.65)',
  fontSize: '13px',
  margin: '0',
  letterSpacing: '0.3px',
};

const heroSection: React.CSSProperties = {
  padding: '40px 48px 32px',
  textAlign: 'center',
};

const h1: React.CSSProperties = {
  color: '#0F172A',
  fontSize: '26px',
  fontWeight: '700',
  margin: '0 0 16px',
  lineHeight: '1.3',
};

const heroBody: React.CSSProperties = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0',
};

const divider: React.CSSProperties = {
  borderColor: '#E8EDF2',
  margin: '0',
};

const featuresSection: React.CSSProperties = {
  padding: '32px 32px 24px',
};

const sectionLabel: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.08em',
  textAlign: 'center',
  margin: '0 0 20px',
};

const featureCell: React.CSSProperties = {
  padding: '0 8px',
  verticalAlign: 'top',
  width: '50%',
};

const featureCard: React.CSSProperties = {
  backgroundColor: '#F8FAFC',
  border: '1px solid #E8EDF2',
  borderRadius: '14px',
  padding: '20px',
  textAlign: 'center',
};

const featureEmoji: React.CSSProperties = {
  fontSize: '28px',
  margin: '0 0 10px',
  lineHeight: '1',
};

const featureTitle: React.CSSProperties = {
  color: '#0F172A',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0 0 6px',
};

const featureBody: React.CSSProperties = {
  color: '#64748B',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
};

const ctaSection: React.CSSProperties = {
  padding: '36px 48px',
  textAlign: 'center',
};

const h2: React.CSSProperties = {
  color: '#0F172A',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 10px',
};

const ctaBody: React.CSSProperties = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const button: React.CSSProperties = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '14px 36px',
  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.35)',
};

const footerSection: React.CSSProperties = {
  backgroundColor: '#F8FAFC',
  padding: '28px 48px',
  textAlign: 'center',
};

const footerText: React.CSSProperties = {
  color: '#334155',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const footerLinks: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: '0 0 12px',
};

const footerLink: React.CSSProperties = {
  color: '#3b82f6',
  textDecoration: 'none',
};

const footerDisclaimer: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '11px',
  lineHeight: '1.6',
  margin: '0',
};
