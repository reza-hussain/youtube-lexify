import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

const PROVIDER_CACHE_TTL_MS = 60_000;

@Injectable()
export class AiService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  private providerCache: { value: string; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async getProvider(): Promise<string> {
    if (this.providerCache && this.providerCache.expiresAt > Date.now()) {
      return this.providerCache.value;
    }
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: 'aiProvider' },
    });
    const value = setting?.value ?? 'claude';
    this.providerCache = {
      value,
      expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS,
    };
    return value;
  }

  /** Returns a definition array in the same format as Free Dictionary API. */
  async getDefinition(
    word: string,
    sentence: string,
    encounterCount: number,
  ): Promise<any[] | null> {
    const provider = await this.getProvider();

    if (provider === 'gemini') {
      return this.callGemini(word, sentence, encounterCount);
    }

    return this.callClaude(word, sentence, encounterCount);
  }

  private buildSystemPrompt(encounterCount: number): string {
    const wantsExtras = encounterCount >= 3;
    const extrasField = wantsExtras
      ? `  "etymology": "<one-sentence etymology to help remember the word>",\n  "tip": "<memorable mnemonic or usage tip>"`
      : `  "etymology": "",\n  "tip": ""`;

    return `You are a concise, context-aware dictionary. Respond ONLY with a valid JSON array in exactly this structure — no markdown, no explanation:
[{
  "word": "<word>",
  "phonetic": "<IPA phonetic or empty string>",
  "phonetics": [],
  "meanings": [
    {
      "partOfSpeech": "<noun|verb|adjective|adverb|etc>",
      "definitions": [
        { "definition": "<definition, specific to the given context>", "example": "<brief example or empty string>" }
      ]
    }
  ],
${extrasField}
}]
If a context sentence is provided, tailor the definition to that exact usage.${wantsExtras ? ' The user has seen this word multiple times — make the definition and tip especially memorable.' : ''}`;
  }

  private async callClaude(
    word: string,
    sentence: string,
    encounterCount: number,
  ): Promise<any[] | null> {
    const userContent = sentence
      ? `Word: "${word}"\nContext sentence: "${sentence}"`
      : `Word: "${word}"`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: this.buildSystemPrompt(encounterCount),
        messages: [{ role: 'user', content: userContent }],
      });

      const text = (message.content[0] as any).text as string;
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private async callGemini(
    _word: string,
    _sentence: string,
    _encounterCount: number,
  ): Promise<any[] | null> {
    // To enable: npm install @google/generative-ai in lexify-api, set GEMINI_API_KEY env var,
    // then replace this stub with the Gemini SDK call using the same response format as callClaude.
    throw new Error(
      'Gemini provider not yet configured. Switch aiProvider back to "claude" in admin settings.',
    );
  }
}
