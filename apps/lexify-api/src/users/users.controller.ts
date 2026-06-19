import { Controller, Delete, Get, UseGuards, Request, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /users/me — returns the current user's profile + subscription status */
  @Get('me')
  getMe(@Request() req: any) {
    return this.usersService.getMe(req.user.id);
  }

  /** DELETE /users/me — GDPR: permanently deletes account and all associated data */
  @Delete('me')
  @HttpCode(200)
  async deleteMe(@Request() req: any) {
    await this.usersService.deleteAccount(req.user.id);
    return { ok: true, message: 'Account and all data permanently deleted.' };
  }
}
