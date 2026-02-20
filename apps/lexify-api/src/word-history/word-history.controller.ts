import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
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

  @Get()
  async getHistory(@Request() req: any) {
    try {
      return await this.wordHistoryService.getHistory(req.user.id);
    } catch (e) {
      console.error("GET /words ERROR:", e);
      throw e;
    }
  }
}
