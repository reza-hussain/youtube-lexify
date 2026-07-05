import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import * as crypto from 'crypto';

const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const FREE_DAILY_LIMIT = 30;
const PRO_DAILY_LIMIT = Infinity;
const AI_DAILY_LIMIT = 200;

@Injectable()
export class WordHistoryService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async defineWord(userId: string, word: string, sentence?: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Account suspended');
    }

    const isPro = user.subscriptionTier === 'PRO';
    const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

    // Reset daily counts if it's a new calendar day
    const now = new Date();
    const resetDate = new Date(user.dailyLookupResetAt);
    const isNewDay =
      now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
      now.getUTCMonth() !== resetDate.getUTCMonth() ||
      now.getUTCDate() !== resetDate.getUTCDate();

    if (isNewDay) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          dailyLookupCount: 0,
          dailyLookupResetAt: now,
          dailyAiLookupCount: 0,
          dailyAiLookupResetAt: now,
        },
      });
      user.dailyLookupCount = 0;
      user.dailyAiLookupCount = 0;
    }

    if (user.dailyLookupCount >= limit) {
      throw new ForbiddenException('Daily lookup quota exceeded');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { dailyLookupCount: { increment: 1 } },
    });

    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    const remaining = limit === Infinity ? null : limit - user.dailyLookupCount - 1;

    const hasAiKey = !!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
    console.log(`[WordHistory] defineWord: word=${cleanWord} isPro=${isPro} hasAiKey=${hasAiKey} aiCount=${user.dailyAiLookupCount}`);

    // PRO: context-aware AI definitions (up to 200/day)
    if (isPro && hasAiKey) {
      if (user.dailyAiLookupCount < AI_DAILY_LIMIT) {
        const encounterCount = await this.prisma.wordEncounter.count({
          where: { wordSense: { userId, word: cleanWord } },
        });

        try {
          const aiDef = await this.aiService.getDefinition(cleanWord, sentence ?? '', encounterCount);
          if (aiDef) {
            await this.prisma.user.update({
              where: { id: userId },
              data: { dailyAiLookupCount: { increment: 1 } },
            });
            return { definition: aiDef, source: 'ai', remaining };
          }
        } catch (err) {
          console.warn('[WordHistory] AI definition failed, falling back to dictionary:', err);
        }
      }
    }

    // Dictionary fallback (FREE users, AI limit reached, or AI failure)
    const dictRes = await fetch(`${DICTIONARY_API}${cleanWord}`);

    if (dictRes.ok) {
      const data = await dictRes.json();
      return { definition: data, source: 'dictionary', remaining };
    }

    if (dictRes.status !== 404) {
      throw new Error(`Dictionary API error: ${dictRes.status}`);
    }

    // Dictionary 404 for PRO: try AI as last resort (e.g. proper nouns, slang)
    if (isPro && hasAiKey) {
      try {
        const aiDef = await this.aiService.getDefinition(cleanWord, sentence ?? '', 0);
        if (aiDef) {
          await this.prisma.user.update({
            where: { id: userId },
            data: { dailyAiLookupCount: { increment: 1 } },
          });
          return { definition: aiDef, source: 'ai', remaining };
        }
      } catch {
        // silent — return null below
      }
    }

    return { definition: null, source: 'dictionary', remaining };
  }

  private detectPlatform(videoUrl: string): string {
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) return 'youtube';
    if (videoUrl.includes('netflix.com')) return 'netflix';
    return 'other';
  }

  async saveWord(userId: string, word: string, meaning: string, videoUrl: string, timestamp: string, contextSentence?: string, source: string = 'dictionary') {
    const rawSenseString = `${word.toLowerCase().trim()}|${meaning.toLowerCase().trim()}`;
    const senseId = crypto.createHash('sha256').update(rawSenseString).digest('hex');

    const result = await this.prisma.$transaction(async (tx) => {
      const sense = await tx.wordSense.upsert({
        where: { userId_senseId: { userId, senseId } },
        update: { source },
        create: { userId, senseId, word: word.trim(), meaning: meaning.trim(), source },
      });

      let encounter = await tx.wordEncounter.findFirst({
        where: { wordSenseId: sense.id, videoUrl, contextSentence: contextSentence || null },
      });

      if (!encounter) {
        encounter = await tx.wordEncounter.create({
          data: { wordSenseId: sense.id, videoUrl, timestamp, contextSentence },
        });
      }

      return { sense, encounter };
    });

    const platform = this.detectPlatform(videoUrl);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    this.prisma.platformUsage.upsert({
      where: { userId_platform_date: { userId, platform, date: today } },
      update: { usageTimeMs: { increment: 1 } },
      create: { userId, platform, usageTimeMs: 1, date: today },
    }).catch(() => {});

    return result;
  }

  async explainSentence(userId: string, sentence: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { subscriptionTier: true, status: true },
    });
    if (user.status === 'SUSPENDED') throw new ForbiddenException('Account suspended');
    if (user.subscriptionTier !== 'PRO') throw new ForbiddenException('PRO subscription required');
    const explanation = await this.aiService.explainSentence(sentence);
    return { explanation };
  }

  async getStats(userId: string) {
    const [totalWords, encounters] = await Promise.all([
      this.prisma.wordSense.count({ where: { userId } }),
      this.prisma.wordEncounter.findMany({
        where: { wordSense: { userId } },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    const todayWords = encounters.filter(e => new Date(e.createdAt) >= todayUTC).length;

    // Compute streak: consecutive days (including today) with at least 1 encounter
    const daySet = new Set(encounters.map(e => e.createdAt.toISOString().split('T')[0]));
    let streak = 0;
    const cursor = new Date();
    cursor.setUTCHours(0, 0, 0, 0);
    while (daySet.has(cursor.toISOString().split('T')[0])) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return { streak, todayWords, totalWords };
  }

  async toggleFavourite(userId: string, wordSenseId: string) {
    const sense = await this.prisma.wordSense.findFirst({
      where: { id: wordSenseId, userId },
      select: { isFavourite: true },
    });
    if (!sense) throw new NotFoundException('Word not found');

    return this.prisma.wordSense.update({
      where: { id: wordSenseId },
      data: { isFavourite: !sense.isFavourite },
      select: { id: true, isFavourite: true },
    });
  }

  async getHistory(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    const limit = user.subscriptionTier === 'PRO' ? undefined : 50;

    return this.prisma.wordSense.findMany({
      where: { userId },
      include: { encounters: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
