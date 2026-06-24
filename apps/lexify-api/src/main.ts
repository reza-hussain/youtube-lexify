import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  // rawBody: true is required for Stripe webhook signature verification
  const app = await NestFactory.create(AppModule, { rawBody: true });
  
  // Set Security Headers
  app.use(helmet({ crossOriginResourcePolicy: false }));
  const allowedOrigins = [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3000',
    'https://youtube-lexify.vercel.app',
    'https://youtubelexify.com',
    'chrome-extension://npbfdllefekhdplbkdigpncggmojpefi',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : []),
  ];
  app.enableCors({
    origin: allowedOrigins,
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
