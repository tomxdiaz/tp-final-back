import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';
import type { Tables } from '../../supabase/database.types';

type AppUser = Tables<'app_user'>;

type AuthenticatedRequest = Request & {
  appUser?: AppUser;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Falta el token de autenticación');
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (appUserError) {
      throw new UnauthorizedException(
        'No se pudo cargar el perfil del usuario',
      );
    }

    if (!appUser) {
      throw new UnauthorizedException('Perfil de usuario no encontrado');
    }

    request.appUser = appUser;

    return true;
  }

  private extractBearerToken(authorizationHeader?: string): string | null {
    if (!authorizationHeader) {
      return null;
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
