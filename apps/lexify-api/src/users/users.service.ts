import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        dailyLookupCount: true,
        dailyLookupResetAt: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Cascade deletes: WordSense → WordEncounter, Preference, PlatformUsage, Session
    // are all handled by Prisma's onDelete: Cascade in the schema.
    // RevenueEvents reference userId but have no FK cascade — delete separately.
    await this.prisma.$transaction([
      this.prisma.revenueEvent.deleteMany({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
  }
}
