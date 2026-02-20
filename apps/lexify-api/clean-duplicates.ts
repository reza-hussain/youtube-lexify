import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const encounters = await prisma.wordEncounter.findMany({
    orderBy: { createdAt: 'asc' }
  });
  
  const seen = new Set();
  let deletedCount = 0;
  
  for (const e of encounters) {
    const key = `${e.wordSenseId}-${e.videoUrl}-${e.contextSentence}`;
    if (seen.has(key)) {
      await prisma.wordEncounter.delete({ where: { id: e.id } });
      deletedCount++;
    } else {
      seen.add(key);
    }
  }
  console.log(`Successfully deleted ${deletedCount} duplicate encounters.`);
  
  await app.close();
}
bootstrap();
