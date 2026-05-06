import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Tables } from '../../supabase/database.types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AppRole } from '../../utils/enums/roles';

type AppUser = Tables<'app_user'>;

type AuthenticatedRequest = Request & {
  appUser?: AppUser;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const currentRole = request.appUser?.global_role;

    if (!currentRole) {
      throw new ForbiddenException('Falta el usuario autenticado');
    }

    if (!requiredRoles.includes(currentRole)) {
      throw new ForbiddenException(
        'No tenés permisos para acceder a este recurso',
      );
    }

    return true;
  }
}
