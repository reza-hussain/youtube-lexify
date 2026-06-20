import { Controller, Post, Get, Body, Req, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('register')
  register(@Body() body: { email: string; password: string; name?: string }) {
    return this.authService.registerUser(body.email, body.password, body.name);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.loginUser(body.email, body.password);
  }

  @Post('chrome')
  async authenticateChromeExtension(
    @Body('token') token: string,
    @Req() req: any,
  ) {
    return this.authService.verifyChromeToken(token, req);
  }

  @Post('web')
  async authenticateWeb(
    @Body('token') token: string,
    @Req() req: any,
  ) {
    return this.authService.verifyWebToken(token, req);
  }

  @Post('admin/login')
  async authenticateAdmin(@Body() body: any) {
    return this.authService.verifyAdminCredentials(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: any) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: req.user.id } });
    return { id: user.id, email: user.email, name: user.name, image: user.avatar };
  }

  @Post('session/close')
  @UseGuards(JwtAuthGuard)
  async closeSession(@Request() _req: any, @Body('sessionId') sessionId: string) {
    await this.authService.closeSession(sessionId);
    return { ok: true };
  }
}
