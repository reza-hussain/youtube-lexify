import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WordHistoryService } from './word-history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('words')
@UseGuards(JwtAuthGuard)
export class WordHistoryController {
  constructor(private readonly wordHistoryService: WordHistoryService) {}

  @Post('save')
  async saveWord(@Request() req: any, @Body() body: any) {
    const userId = req.user.id;
    const { word, meaning, videoUrl, timestamp, contextSentence } = body;
    return this.wordHistoryService.saveWord(userId, word, meaning, videoUrl, timestamp, contextSentence);
  }

  @Get('define/:word')
  async defineWord(@Request() req: any, @Param('word') word: string) {
    return this.wordHistoryService.defineWord(req.user.id, word);
  }

  @Get()
  async getHistory(@Request() req: any) {
    try {
      const words = await this.wordHistoryService.getHistory(req.user.id);
      return words;
    } catch (e) {
      console.error("GET /words ERROR:", e);
      throw e;
    }
  }
}
