import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { WordHistoryModule } from './word-history/word-history.module';
import { PreferenceModule } from './preference/preference.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EmailModule } from './email/email.module';
import { AdminModule } from './admin/admin.module';
import { PingModule } from './ping/ping.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { UsersModule } from './users/users.module';
import { BetaModule } from './beta/beta.module';
import { LoggingInterceptor } from './common/logging.interceptor';

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
    PreferenceModule, EmailModule, AdminModule, PingModule, SubscriptionModule, UsersModule, BetaModule
  ],
  controllers: [AppController],
  providers: [
     AppService,
     PrismaService,
     {
        provide: APP_GUARD,
        useClass: ThrottlerGuard,
     },
     {
        provide: APP_INTERCEPTOR,
        useClass: LoggingInterceptor,
     },
  ],
})
export class AppModule {}
