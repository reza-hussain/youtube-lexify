import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { BetaService } from './beta.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('beta')
@UseGuards(JwtAuthGuard)
export class BetaController {
  constructor(private readonly betaService: BetaService) {}

  @Post('request')
  requestAccess(@Request() req: any, @Body() body: { source?: string }) {
    return this.betaService.requestAccess(req.user.id, body.source);
  }

  @Get('status')
  getStatus(@Request() req: any) {
    return this.betaService.getStatus(req.user.id);
  }
}
