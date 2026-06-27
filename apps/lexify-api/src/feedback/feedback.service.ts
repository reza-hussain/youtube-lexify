import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async submit(userId: string, body: { rating: number; category: string; message: string; anonymous: boolean }) {
    const { rating, category, message, anonymous } = body;

    if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be between 1 and 5');
    if (!['review', 'bug', 'feature'].includes(category)) throw new BadRequestException('Invalid category');
    if (!message?.trim()) throw new BadRequestException('Message is required');

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, name: true },
    });

    const feedback = await this.prisma.feedback.create({
      data: {
        userId: anonymous ? null : userId,
        rating,
        category,
        message: message.trim(),
        anonymous,
      },
    });

    await this.email.sendFeedbackAlert({
      rating,
      category,
      message: message.trim(),
      userName: anonymous ? 'Anonymous' : (user.name ?? 'Unknown'),
      userEmail: anonymous ? null : user.email,
      feedbackId: feedback.id,
    });

    return { ok: true };
  }

  async getFeatured() {
    return this.prisma.feedback.findMany({
      where: { featured: true, category: 'review' },
      select: {
        id: true,
        rating: true,
        message: true,
        anonymous: true,
        createdAt: true,
        user: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAll() {
    return this.prisma.feedback.findMany({
      include: {
        user: { select: { name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleFeatured(id: string) {
    const fb = await this.prisma.feedback.findUniqueOrThrow({ where: { id } });
    return this.prisma.feedback.update({
      where: { id },
      data: { featured: !fb.featured },
    });
  }
}
