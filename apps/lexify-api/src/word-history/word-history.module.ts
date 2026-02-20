import { Module } from '@nestjs/common';
import { WordHistoryService } from './word-history.service';
import { WordHistoryController } from './word-history.controller';

@Module({
  controllers: [WordHistoryController],
  providers: [WordHistoryService],
})
export class WordHistoryModule {}
