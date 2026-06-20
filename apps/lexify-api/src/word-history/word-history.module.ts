import { Module } from '@nestjs/common';
import { WordHistoryService } from './word-history.service';
import { WordHistoryController } from './word-history.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [WordHistoryController],
  providers: [WordHistoryService],
})
export class WordHistoryModule {}
