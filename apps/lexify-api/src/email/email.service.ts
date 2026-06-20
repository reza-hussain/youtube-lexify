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
        from: 'Lexify <onboarding@resend.dev>',
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

  async sendWelcomeEmail(to: string, name: string) {
    try {
      // Create the email component
      const emailHtml = await render(
        React.createElement(LexifyWelcomeEmail, {
          userFirstname: name,
        }),
      );

      const data = await this.resend.emails.send({
        from: 'Lexify <onboarding@resend.dev>', // Update when verifying domains
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
