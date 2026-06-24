import { Module } from '@nestjs/common';
import { BetaController } from './beta.controller';
import { BetaService } from './beta.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [BetaController],
  providers: [BetaService],
  exports: [BetaService],
})
export class BetaModule {}
