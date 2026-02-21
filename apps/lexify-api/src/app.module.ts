import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WordHistoryModule } from './word-history/word-history.module';
import { PreferenceModule } from './preference/preference.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EmailModule } from './email/email.module';
import { AdminModule } from './admin/admin.module';
import { PingModule } from './ping/ping.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
       ttl: 60000, 
       limit: 100 
    }]),
    PrismaModule, 
    AuthModule, 
    WordHistoryModule, 
    PreferenceModule, EmailModule, AdminModule, PingModule
  ],
  controllers: [AppController],
  providers: [
     AppService,
     {
        provide: APP_GUARD,
        useClass: ThrottlerGuard,
     }
  ],
})
export class AppModule {}
