import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { WordHistoryService } from './word-history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('words')
@UseGuards(JwtAuthGuard)
export class WordHistoryController {
  constructor(private readonly wordHistoryService: WordHistoryService) {}

  @Post('define')
  async defineWord(@Request() req: any, @Body() body: { word: string; sentence?: string }) {
    return this.wordHistoryService.defineWord(req.user.id, body.word, body.sentence);
  }

  @Post('save')
  async saveWord(@Request() req: any, @Body() body: any) {
    const { word, meaning, videoUrl, timestamp, contextSentence } = body;
    return this.wordHistoryService.saveWord(req.user.id, word, meaning, videoUrl, timestamp, contextSentence);
  }

  @Get()
  async getHistory(@Request() req: any) {
    try {
      return await this.wordHistoryService.getHistory(req.user.id);
    } catch (e) {
      console.error('GET /words ERROR:', e);
      throw e;
    }
  }
}
