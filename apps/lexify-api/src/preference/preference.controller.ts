import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { PreferenceService } from './preference.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferenceController {
  constructor(private readonly preferenceService: PreferenceService) {}

  @Get()
  async getPreferences(@Request() req: any) {
    return this.preferenceService.getPreferences(req.user.id);
  }

  @Patch()
  async updatePreferences(@Request() req: any, @Body() body: any) {
    return this.preferenceService.updatePreferences(req.user.id, body);
  }
}
