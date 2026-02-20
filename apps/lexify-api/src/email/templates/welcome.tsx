import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface LexifyWelcomeEmailProps {
  userFirstname: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

export const LexifyWelcomeEmail = ({
  userFirstname,
}: LexifyWelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Lexify - Understand Every Word. Instantly.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Img
              src={`https://www.youtube-lexify.com/logo.png`} // Ideally hook this to a hosted logo link
              width="48"
              height="48"
              alt="Lexify"
              style={logo}
            />
            <hr style={hr} />
            <Text style={paragraph}>Hi {userFirstname},</Text>
            <Text style={paragraph}>
              Welcome to <b>YouTube Lexify!</b> We are thrilled to have you onboard.
            </Text>
            <Text style={paragraph}>
              Lexify is designed to be your default language learning companion while watching YouTube videos. 
              The next time you encounter a word you don't know, simply hover over the subtitle and we'll instantly define it for you, 
              complete with context and saved history right here in your dashboard.
            </Text>
            <Section style={btnContainer}>
              <Link href={`${baseUrl}/dashboard`} style={button}>
                Explore Your Dashboard
              </Link>
            </Section>
            <Text style={paragraph}>
              Best,
              <br />
              The Lexify Team
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              You received this email because you signed up for YouTube Lexify.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default LexifyWelcomeEmail;

// --- STYLES (Liquid Glass Inspired) ---

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '18px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
  border: '1px solid #E2E6EB',
};

const box = {
  padding: '0 48px',
};

const logo = {
  margin: '0 auto',
  display: 'block',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '15px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const btnContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#4DA3FF',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px 16px',
  fontWeight: '600',
  boxShadow: '0 4px 14px 0 rgba(77, 163, 255, 0.39)',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};
