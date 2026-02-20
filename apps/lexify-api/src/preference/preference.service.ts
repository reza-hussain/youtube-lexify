import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PreferenceService {
  constructor(private prisma: PrismaService) {}

  async getPreferences(userId: string) {
    let pref = await this.prisma.preference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await this.prisma.preference.create({
        data: { userId },
      });
    }

    return pref;
  }

  async updatePreferences(userId: string, data: any) {
    return this.prisma.preference.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId },
    });
  }
}
