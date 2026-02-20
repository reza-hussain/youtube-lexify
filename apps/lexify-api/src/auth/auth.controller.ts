import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('chrome')
  async authenticateChromeExtension(@Body('token') token: string) {
    return this.authService.verifyChromeToken(token);
  }

  @Post('web')
  async authenticateWeb(@Body('token') token: string) {
    return this.authService.verifyWebToken(token);
  }

  @Post('admin/login')
  async authenticateAdmin(@Body() body: any) {
    return this.authService.verifyAdminCredentials(body.email, body.password);
  }
}
