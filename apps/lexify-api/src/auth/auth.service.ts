import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';

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

  async registerUser(email: string, password: string, name?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already in use');

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hashed, name: name || email.split('@')[0] },
    });

    this.emailService.sendWelcomeEmail(user.email, user.name || 'User');
    this.emailService.sendAdminNewUserAlert(user.email, user.name || 'User');

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async loginUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
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

  private async openSession(userId: string, req?: Request): Promise<string> {
    const ipAddress = req
      ? ((req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ?? req.ip ?? null)
      : null;
    const deviceInfo = req ? (req.headers['user-agent'] ?? null) : null;
    const session = await this.prisma.session.create({
      data: { userId, ipAddress, deviceInfo },
    });
    return session.id;
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return;
    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { endedAt, durationSeconds },
    });
  }

  async verifyChromeToken(accessToken: string, req?: Request) {
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
         this.emailService.sendWelcomeEmail(user.email, user.name || 'User');
         this.emailService.sendAdminNewUserAlert(user.email, user.name || 'User');
       }

       const payload = { email: user.email, sub: user.id };
       const sessionId = await this.openSession(user.id, req);
       return {
          access_token: this.jwtService.sign(payload),
          session_id: sessionId,
          user,
       };

     } catch (err) {
       console.error("Token verification failed:", err);
       throw new UnauthorizedException('Failed to verify Google token');
     }
  }
  async verifyWebToken(idToken: string, req?: Request) {
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
         this.emailService.sendWelcomeEmail(user.email, user.name || 'User');
         this.emailService.sendAdminNewUserAlert(user.email, user.name || 'User');
       }

       const payload = { email: user.email, sub: user.id };
       const sessionId = await this.openSession(user.id, req);
       return {
          access_token: this.jwtService.sign(payload),
          session_id: sessionId,
          user,
       };

     } catch (err) {
       console.error("Web token verification failed:", err);
       throw new UnauthorizedException('Failed to verify Google Web token');
     }
  }
}
