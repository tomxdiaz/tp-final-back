import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';
import type { Tables } from '../../supabase/database.types';

type AppUser = Tables<'app_user'>;

type AuthenticatedRequest = Request & {
  appUser?: AppUser;
};

@Injectable()
export class OptionalSupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) return true;

    try {
      const supabase = this.supabaseService.getAdminClient();

      const { data: userData, error: userError } =
        await supabase.auth.getUser(token);

      if (userError || !userData.user) return true;

      const { data: appUser } = await supabase
        .from('app_user')
        .select('*')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (appUser) {
        request.appUser = appUser;
      }
    } catch {
      // Ignore errors — endpoint remains public
    }

    return true;
  }

  private extractBearerToken(authorizationHeader?: string): string | null {
    if (!authorizationHeader) return null;
    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    return token;
  }
}
