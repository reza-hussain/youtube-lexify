import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set Security Headers
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:3000',
      'chrome-extension://npbfdllefekhdplbkdigpncggmojpefi'
    ],
    credentials: true,
  });
  
  // Enforce strict DTO validation (prevent NoSQL Injection from unknown properties)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
