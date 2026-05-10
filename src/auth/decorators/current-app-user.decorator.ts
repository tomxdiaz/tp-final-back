import {
  UnauthorizedException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Tables } from '../../supabase/database.types';

type AppUser = Tables<'app_user'>;

type AuthenticatedRequest = Request & {
  appUser?: AppUser;
};

const currentAppUserDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AppUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.appUser) {
      throw new UnauthorizedException(
        'Authenticated app_user is not available',
      );
    }

    return request.appUser;
  },
);

export const CurrentAppUser: ParameterDecorator = currentAppUserDecorator();
