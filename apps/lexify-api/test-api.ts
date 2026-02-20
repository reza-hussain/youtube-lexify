import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { WordHistoryService } from './src/word-history/word-history.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(WordHistoryService);
  
  // Try to fetch words for an arbitrary user Id, this will trigger the Prisma query
  try {
     const words = await service.getHistory('dummy-user-id');
     console.log('Success:', words);
  } catch(e) {
     console.error('FAIL GRACEFULLY', e);
  }
  
  await app.close();
}
bootstrap();
