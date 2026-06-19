import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import Anthropic from '@anthropic-ai/sdk';

const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const FREE_DAILY_LIMIT = 30;
const PRO_DAILY_LIMIT = Infinity;

@Injectable()
export class WordHistoryService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  constructor(private prisma: PrismaService) {}

  async defineWord(userId: string, word: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Account suspended');
    }

    const limit = user.subscriptionTier === 'PRO' ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

    // Reset daily count if it's a new calendar day
    const now = new Date();
    const resetDate = new Date(user.dailyLookupResetAt);
    const isNewDay =
      now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
      now.getUTCMonth() !== resetDate.getUTCMonth() ||
      now.getUTCDate() !== resetDate.getUTCDate();

    if (isNewDay) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { dailyLookupCount: 0, dailyLookupResetAt: now },
      });
      user.dailyLookupCount = 0;
    }

    if (user.dailyLookupCount >= limit) {
      throw new ForbiddenException('Daily lookup quota exceeded');
    }

    // Increment count
    await this.prisma.user.update({
      where: { id: userId },
      data: { dailyLookupCount: { increment: 1 } },
    });

    // Fetch from free dictionary
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    const remaining = limit === Infinity ? null : limit - user.dailyLookupCount - 1;
    const dictRes = await fetch(`${DICTIONARY_API}${cleanWord}`);

    if (dictRes.ok) {
      const data = await dictRes.json();
      return { definition: data, source: 'dictionary', remaining };
    }

    if (dictRes.status !== 404) {
      throw new Error(`Dictionary API error: ${dictRes.status}`);
    }

    // Dictionary miss — AI fallback only for PRO users
    if (user.subscriptionTier !== 'PRO' || !process.env.ANTHROPIC_API_KEY) {
      return { definition: null, source: 'dictionary', remaining };
    }

    const aiDefinition = await this.getAiDefinition(cleanWord);
    return { definition: aiDefinition, source: 'ai', remaining };
  }

  private async getAiDefinition(word: string) {
    const message = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You are a dictionary. When given a word, respond with a JSON object in exactly this structure:
[{
  "word": "<word>",
  "phonetic": "<IPA phonetic if known, else empty string>",
  "phonetics": [],
  "meanings": [
    {
      "partOfSpeech": "<noun|verb|adjective|adverb|etc>",
      "definitions": [
        { "definition": "<definition text>", "example": "<example sentence or empty string>" }
      ]
    }
  ]
}]
Respond ONLY with valid JSON, no markdown, no explanation.`,
      messages: [{ role: 'user', content: word }],
    });

    const text = (message.content[0] as any).text as string;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private detectPlatform(videoUrl: string): string {
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) return 'youtube';
    if (videoUrl.includes('netflix.com')) return 'netflix';
    return 'other';
  }

  async saveWord(userId: string, word: string, meaning: string, videoUrl: string, timestamp: string, contextSentence?: string) {
    // 1. Generate a deterministic Sense ID based on the specific word + meaning
    const rawSenseString = `${word.toLowerCase().trim()}|${meaning.toLowerCase().trim()}`;
    const senseId = crypto.createHash('sha256').update(rawSenseString).digest('hex');

    // 2. Transact to guarantee both objects are created safely
    const result = await this.prisma.$transaction(async (tx) => {
       // Upsert the unique WordSense
       const sense = await tx.wordSense.upsert({
          where: {
            userId_senseId: {
               userId,
               senseId
            }
          },
          update: {}, // No updates needed if it already exists
          create: {
             userId,
             senseId,
             word: word.trim(),
             meaning: meaning.trim()
          }
       });

       // Check if an identical encounter already exists to prevent dashboard spam
       let encounter = await tx.wordEncounter.findFirst({
          where: {
             wordSenseId: sense.id,
             videoUrl,
             contextSentence: contextSentence || null
          }
       });

       if (!encounter) {
          // Create the new WordEncounter instance if it doesn't exist
          encounter = await tx.wordEncounter.create({
             data: {
                wordSenseId: sense.id,
                videoUrl,
                timestamp,
                contextSentence
             }
          });
       }

       return { sense, encounter };
    });

    // Track platform usage (best-effort, non-blocking)
    const platform = this.detectPlatform(videoUrl);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    this.prisma.platformUsage.upsert({
      where: {
        userId_platform_date: { userId, platform, date: today },
      },
      update: { usageTimeMs: { increment: 1 } }, // increment = 1 event, not ms — repurposed as encounter count
      create: { userId, platform, usageTimeMs: 1, date: today },
    }).catch(() => {}); // fire and forget

    return result;
  }

  async getHistory(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    const limit = user.subscriptionTier === 'PRO' ? undefined : 50;

    return this.prisma.wordSense.findMany({
      where: { userId },
      include: {
        encounters: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
