import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const BETA_SLOTS = 50;

@Injectable()
export class BetaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async requestAccess(userId: string, source?: string) {
    const existing = await this.prisma.betaRequest.findUnique({ where: { userId } });
    if (existing) {
      return { status: existing.status, alreadyRequested: true };
    }

    const approvedCount = await this.prisma.betaRequest.count({ where: { status: 'APPROVED' } });
    if (approvedCount >= BETA_SLOTS) {
      throw new BadRequestException('All beta slots are full');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, name: true },
    });

    const request = await this.prisma.betaRequest.create({
      data: { userId, source: source ?? null },
    });

    await this.email.sendBetaRequestReceived(user.email, user.name ?? 'there');
    await this.email.sendAdminBetaRequest(user.email, user.name ?? '', request.id);

    return { status: 'PENDING', alreadyRequested: false };
  }

  async getStatus(userId: string) {
    const request = await this.prisma.betaRequest.findUnique({ where: { userId } });
    const approvedCount = await this.prisma.betaRequest.count({ where: { status: 'APPROVED' } });
    return {
      request: request ?? null,
      slotsRemaining: Math.max(0, BETA_SLOTS - approvedCount),
    };
  }
}
