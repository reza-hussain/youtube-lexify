import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { LexifyWelcomeEmail } from './templates/welcome';
import * as React from 'react';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
  }

  async sendAdminNewUserAlert(newUserEmail: string, newUserName: string) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;
    try {
      await this.resend.emails.send({
        from: 'Lexify <hi@youtubelexify.com>',
        to: [adminEmail],
        subject: `New user signed up: ${newUserEmail}`,
        html: `<p>A new user just signed up on Lexify.</p>
               <p><strong>Name:</strong> ${newUserName}</p>
               <p><strong>Email:</strong> ${newUserEmail}</p>`,
      });
    } catch (error) {
      console.error('Error sending admin new-user alert:', error);
    }
  }

  async sendBetaRequestReceived(to: string, name: string) {
    try {
      await this.resend.emails.send({
        from: 'Lexify <hi@youtubelexify.com>',
        to: [to],
        subject: 'Your Lexify beta access request was received!',
        html: `<p>Hi ${name},</p>
               <p>We received your request for 1 month of free Lexify Pro access. We'll review it and get back to you shortly.</p>
               <p>Thanks for your interest!</p>
               <p>— The Lexify Team</p>`,
      });
    } catch (err) {
      console.error('Error sending beta request email:', err);
    }
  }

  async sendAdminBetaRequest(userEmail: string, userName: string, requestId: string) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;
    const adminUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/admin`
      : 'https://youtubelexify.com/admin';
    try {
      await this.resend.emails.send({
        from: 'Lexify <hi@youtubelexify.com>',
        to: [adminEmail],
        subject: `Beta access request from ${userEmail}`,
        html: `<p><strong>${userName}</strong> (${userEmail}) requested 1 month of free Lexify Pro access.</p>
               <p>Request ID: <code>${requestId}</code></p>
               <p><a href="${adminUrl}">Review in Admin Portal →</a></p>`,
      });
    } catch (err) {
      console.error('Error sending admin beta alert:', err);
    }
  }

  async sendBetaApproved(to: string, name: string, expiresAt: Date) {
    const expiry = expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    try {
      await this.resend.emails.send({
        from: 'Lexify <hi@youtubelexify.com>',
        to: [to],
        subject: '🎉 Your Lexify Pro access has been approved!',
        html: `<p>Hi ${name},</p>
               <p>Great news — your request for free Lexify Pro access has been <strong>approved</strong>!</p>
               <p>Your Pro access is active until <strong>${expiry}</strong>. Enjoy unlimited lookups and all Pro features.</p>
               <p><a href="https://youtubelexify.com/dashboard">Open your dashboard →</a></p>
               <p>— The Lexify Team</p>`,
      });
    } catch (err) {
      console.error('Error sending beta approved email:', err);
    }
  }

  async sendBetaRejected(to: string, name: string) {
    try {
      await this.resend.emails.send({
        from: 'Lexify <hi@youtubelexify.com>',
        to: [to],
        subject: 'Update on your Lexify beta access request',
        html: `<p>Hi ${name},</p>
               <p>Unfortunately we weren't able to approve your beta access request at this time — all spots have been filled.</p>
               <p>You can still use Lexify for free (30 lookups/day), and we'll let you know when more spots open up.</p>
               <p>— The Lexify Team</p>`,
      });
    } catch (err) {
      console.error('Error sending beta rejected email:', err);
    }
  }

  async sendFeedbackAlert(opts: {
    rating: number;
    category: string;
    message: string;
    userName: string;
    userEmail: string | null;
    feedbackId: string;
  }) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;
    const stars = '⭐'.repeat(opts.rating);
    const categoryLabel = opts.category === 'review' ? '📝 Review' : opts.category === 'bug' ? '🐛 Bug Report' : '💡 Feature Request';
    try {
      await this.resend.emails.send({
        from: 'Youtube Lexify <hi@youtubelexify.com>',
        to: [adminEmail],
        subject: `${stars} New ${categoryLabel} from ${opts.userName}`,
        html: `
          <h2>${categoryLabel} — ${stars}</h2>
          <p><strong>From:</strong> ${opts.userName}${opts.userEmail ? ` (${opts.userEmail})` : ' (anonymous)'}</p>
          <blockquote style="border-left:4px solid #4DA3FF;padding-left:12px;color:#333">${opts.message}</blockquote>
          <p style="color:#888;font-size:12px">Feedback ID: ${opts.feedbackId}</p>
        `,
      });
    } catch (err) {
      console.error('Error sending feedback alert:', err);
    }
  }

  async sendWelcomeEmail(to: string, name: string) {
    try {
      // Create the email component
      const emailHtml = await render(
        React.createElement(LexifyWelcomeEmail, {
          userFirstname: name,
        }),
      );

      const data = await this.resend.emails.send({
        from: 'Lexify <hi@youtubelexify.com>', // Update when verifying domains
        to: [to],
        subject: 'Welcome to YouTube Lexify!',
        html: emailHtml,
      });

      console.log('Welcome email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // We don't throw here to avoid disrupting the auth flow if email fails
      return null;
    }
  }
}
