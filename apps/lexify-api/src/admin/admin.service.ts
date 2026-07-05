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

  async getActiveUsersChart(days = 7): Promise<{ name: string; users: number }[]> {
    // Build a date series for the past N days so days with zero sessions still appear
    const result: { name: string; users: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setUTCDate(day.getUTCDate() - i);
      day.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setUTCHours(23, 59, 59, 999);

      const count = await this.prisma.session.findMany({
        where: { startedAt: { gte: day, lte: dayEnd } },
        select: { userId: true },
        distinct: ['userId'],
      });

      result.push({
        name: day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
        users: count.length,
      });
    }

    return result;
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

  async getAppSettings() {
    return this.prisma.appSetting.findMany();
  }

  async updateAppSetting(key: string, value: string) {
    return this.prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
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
