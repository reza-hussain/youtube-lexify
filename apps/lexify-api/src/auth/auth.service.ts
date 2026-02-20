import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async verifyAdminCredentials(email: string, passwordString: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied: Unauthorized role');
    }

    const isMatch = await bcrypt.compare(passwordString, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      }
    };
  }

  async verifyChromeToken(accessToken: string) {
     try {
       // Chrome Identity API gives us an access token
       const tokenInfo = await this.googleClient.getTokenInfo(accessToken);
       
       if (!tokenInfo || !tokenInfo.email) {
          throw new UnauthorizedException('Invalid Google token');
       }

       // Find or create user
       let user = await this.prisma.user.findUnique({
          where: { email: tokenInfo.email }
       });

       if (!user) {
         user = await this.prisma.user.create({
            data: {
               email: tokenInfo.email,
               name: tokenInfo.email.split('@')[0], // simplistic fallback
            }
         });
         // Fire and forget welcome email
         this.emailService.sendWelcomeEmail(user.email, user.name || 'User');
       }

       const payload = { email: user.email, sub: user.id };
       return {
          access_token: this.jwtService.sign(payload),
          user
       };

     } catch (err) {
       console.error("Token verification failed:", err);
       throw new UnauthorizedException('Failed to verify Google token');
     }
  }
  async verifyWebToken(idToken: string) {
     try {
       // Web dashboard uses NextAuth, which gives us an ID token
       const ticket = await this.googleClient.verifyIdToken({
          idToken: idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
       });
       
       const payloadToken = ticket.getPayload();
       
       if (!payloadToken || !payloadToken.email) {
          throw new UnauthorizedException('Invalid Google ID token');
       }

       // Find or create user
       let user = await this.prisma.user.findUnique({
          where: { email: payloadToken.email }
       });

       if (!user) {
         user = await this.prisma.user.create({
            data: {
               email: payloadToken.email,
               name: payloadToken.name || payloadToken.email.split('@')[0],
            }
         });
         // Fire and forget welcome email
         this.emailService.sendWelcomeEmail(user.email, user.name || 'User');
       }

       const payload = { email: user.email, sub: user.id };
       return {
          access_token: this.jwtService.sign(payload),
          user
       };

     } catch (err) {
       console.error("Web token verification failed:", err);
       throw new UnauthorizedException('Failed to verify Google Web token');
     }
  }
}
