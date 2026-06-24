import { Controller, Get, Patch, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BetaService } from '../beta/beta.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly betaService: BetaService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Get('app-settings')
  getAppSettings() {
    return this.adminService.getAppSettings();
  }

  @Patch('app-settings')
  updateAppSetting(@Body() body: { key: string; value: string }) {
    return this.adminService.updateAppSetting(body.key, body.value);
  }

  @Get('words')
  getWordAnalytics() {
    return this.adminService.getWordAnalytics();
  }

  @Get('beta/requests')
  getBetaRequests() {
    return this.prisma.betaRequest.findMany({
      include: { user: { select: { email: true, name: true, createdAt: true } } },
      orderBy: { requestedAt: 'desc' },
    });
  }

  @Post('beta/grant/:requestId')
  async grantBeta(@Param('requestId') requestId: string) {
    const req = await this.prisma.betaRequest.findUniqueOrThrow({ where: { id: requestId }, include: { user: true } });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.prisma.betaRequest.update({ where: { id: requestId }, data: { status: 'APPROVED', reviewedAt: new Date() } });
    await this.prisma.user.update({
      where: { id: req.userId },
      data: { subscriptionTier: 'PRO', subscriptionStatus: 'ACTIVE', betaProExpiresAt: expiresAt },
    });
    await this.emailService.sendBetaApproved(req.user.email, req.user.name ?? 'there', expiresAt);
    return { ok: true };
  }

  @Post('beta/reject/:requestId')
  async rejectBeta(@Param('requestId') requestId: string) {
    const req = await this.prisma.betaRequest.findUniqueOrThrow({ where: { id: requestId }, include: { user: true } });
    await this.prisma.betaRequest.update({ where: { id: requestId }, data: { status: 'REJECTED', reviewedAt: new Date() } });
    await this.emailService.sendBetaRejected(req.user.email, req.user.name ?? 'there');
    return { ok: true };
  }
}
