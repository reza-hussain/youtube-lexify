import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WordHistoryService {
  constructor(private prisma: PrismaService) {}

  async saveWord(userId: string, word: string, meaning: string, videoUrl: string, timestamp: string, contextSentence?: string) {
    // 1. Generate a deterministic Sense ID based on the specific word + meaning
    const rawSenseString = `${word.toLowerCase().trim()}|${meaning.toLowerCase().trim()}`;
    const senseId = crypto.createHash('sha256').update(rawSenseString).digest('hex');

    // 2. Transact to guarantee both objects are created safely
    return this.prisma.$transaction(async (tx) => {
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
  }

  async getHistory(userId: string) {
    return this.prisma.wordSense.findMany({
      where: { userId },
      include: {
         encounters: {
            orderBy: { createdAt: 'desc' }
         }
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
