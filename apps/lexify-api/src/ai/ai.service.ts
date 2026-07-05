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
      ? `  "etymology": "<one-sentence etymology to help remember the word>",\n  "tip": "<memorable mnemonic or usage tip>",`
      : `  "etymology": "",\n  "tip": "",`;

    return `You are a concise, context-aware dictionary. Respond ONLY with a valid JSON array in exactly this structure — no markdown, no explanation:
[{
  "word": "<word>",
  "phonetic": "<IPA phonetic or empty string>",
  "phonetics": [],
  "cefr": "<A1|A2|B1|B2|C1|C2>",
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

  /** Explain a full subtitle sentence in plain English. PRO only. */
  async explainSentence(sentence: string): Promise<string | null> {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: `You are a friendly English teacher helping a language learner understand YouTube content. Given a sentence, explain it in 2–3 short sentences. Cover idioms, cultural references, unusual grammar, or implicit meaning. Plain text only — no markdown.`,
        messages: [{ role: 'user', content: `Explain: "${sentence}"` }],
      });
      return (message.content[0] as any).text as string;
    } catch {
      return null;
    }
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private async callGemini(
    word: string,
    sentence: string,
    encounterCount: number,
  ): Promise<any[] | null> {
    const userContent = sentence
      ? `Word: "${word}"\nContext sentence: "${sentence}"`
      : `Word: "${word}"`;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: this.buildSystemPrompt(encounterCount) }],
            },
            contents: [{ parts: [{ text: userContent }] }],
            generationConfig: { maxOutputTokens: 400 },
          }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[AiService] Gemini HTTP ${res.status}:`, errText);
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data: any = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const text: string =
        data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const clean = text.replace(/```json\n?|```/g, '').trim();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(clean);
    } catch (err) {
      console.error('[AiService] Gemini call failed:', err);
      return null;
    }
  }
}
