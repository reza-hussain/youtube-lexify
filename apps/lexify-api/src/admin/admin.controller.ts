import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverviewStats();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Patch('users/:id/suspend')
  toggleSuspendUser(@Param('id') id: string) {
    return this.adminService.toggleSuspendUser(id);
  }

  @Get('feature-flags')
  getFeatureFlags() {
    return this.adminService.getFeatureSettings();
  }

  @Patch('feature-flags')
  toggleFeatureFlag(@Body() body: { key: string; isEnabled: boolean }) {
    return this.adminService.toggleFeatureFlag(body.key, body.isEnabled);
  }

  @Get('words')
  getWordAnalytics() {
    return this.adminService.getWordAnalytics();
  }
}
