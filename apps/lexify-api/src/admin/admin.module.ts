import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BetaModule } from '../beta/beta.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [BetaModule, EmailModule, PrismaModule, FeedbackModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
