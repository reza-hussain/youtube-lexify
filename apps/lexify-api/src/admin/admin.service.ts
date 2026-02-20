import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewStats() {
    const totalUsers = await this.prisma.user.count();
    const totalWordsSaved = await this.prisma.wordSense.count();

    // Today DAU
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dau = await this.prisma.session.count({
      where: {
        startedAt: { gte: today }
      }
    });

    const mauDate = new Date();
    mauDate.setDate(mauDate.getDate() - 30);
    const mau = await this.prisma.session.count({
      where: {
        startedAt: { gte: mauDate }
      }
    });

    return {
      totalUsers,
      totalWordsSaved,
      dau,
      mau,
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { wordSenses: true, sessions: true }
        }
      }
    });
  }

  async getUserDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        preference: true,
        wordSenses: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        platformUsage: true,
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async toggleSuspendUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    return this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, email: true, status: true }
    });
  }

  async getFeatureSettings() {
    return this.prisma.featureFlag.findMany();
  }

  async toggleFeatureFlag(key: string, isEnabled: boolean) {
    return this.prisma.featureFlag.upsert({
      where: { key },
      update: { isEnabled },
      create: { key, name: key, isEnabled, description: '' }
    });
  }

  async getWordAnalytics() {
    // Top logged words/senses
    const topWords = await this.prisma.wordSense.groupBy({
      by: ['word', 'language'],
      _count: { word: true },
      orderBy: { _count: { word: 'desc' } },
      take: 20
    });

    // Language distribution
    const byLanguage = await this.prisma.wordSense.groupBy({
      by: ['language'],
      _count: { language: true },
      orderBy: { _count: { language: 'desc' } }
    });

    return {
      topWords,
      byLanguage
    };
  }
}
