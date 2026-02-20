import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, User } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }
    
    const request = context.switchToHttp().getRequest();
    const jwtUser = request.user; // Set by JwtAuthGuard

    if (!jwtUser || (!jwtUser.id && !jwtUser.sub)) {
      throw new ForbiddenException('User is not authenticated properly');
    }

    // Always fetch the freshest role from DB just to be safe
    const user = await this.prisma.user.findUnique({
      where: { id: jwtUser.id || jwtUser.sub }
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Require one of these roles: ${requiredRoles.join(', ')}`);
    }

    // Attach fresh user to request for convenience
    request.userEntity = user;

    return true;
  }
}
