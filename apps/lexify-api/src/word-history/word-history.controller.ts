import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
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
    const { word, meaning, videoUrl, timestamp, contextSentence, source } = body;
    return this.wordHistoryService.saveWord(req.user.id, word, meaning, videoUrl, timestamp, contextSentence, source);
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

  @Post('explain-sentence')
  async explainSentence(@Request() req: any, @Body() body: { sentence: string }) {
    return this.wordHistoryService.explainSentence(req.user.id, body.sentence);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.wordHistoryService.getStats(req.user.id);
  }

  @Patch(':id/favourite')
  async toggleFavourite(@Request() req: any, @Param('id') id: string) {
    return this.wordHistoryService.toggleFavourite(req.user.id, id);
  }
}
